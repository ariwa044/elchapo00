create table public.transfer_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code text not null,
  purpose text not null default 'transfer',
  amount numeric(18,2),
  used boolean not null default false,
  expires_at timestamptz not null default now() + interval '10 minutes',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant all on public.transfer_otps to service_role;
alter table public.transfer_otps enable row level security;
create policy "Admins can view transfer codes" on public.transfer_otps
  for select to authenticated using (public.has_role(auth.uid(),'admin'));

create trigger transfer_otps_updated_at before update on public.transfer_otps
  for each row execute function public.set_updated_at();

create index transfer_otps_user_idx on public.transfer_otps (user_id, created_at desc);

create or replace function public.request_transfer_otp(_purpose text default 'transfer', _amount numeric default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  c text;
  rec public.transfer_otps%rowtype;
  em text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.transfer_otps set used = true
    where user_id = auth.uid() and used = false;
  c := lpad((floor(random()*1000000))::int::text, 6, '0');
  insert into public.transfer_otps (user_id, code, purpose, amount)
  values (auth.uid(), c, coalesce(_purpose,'transfer'), _amount)
  returning * into rec;
  select coalesce(email,'') into em from public.profiles where id = auth.uid();
  return jsonb_build_object('id', rec.id, 'expires_at', rec.expires_at, 'email', em);
end;
$$;

create or replace function public.consume_transfer_otp(_code text, _amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare rec public.transfer_otps%rowtype;
begin
  select * into rec from public.transfer_otps
   where user_id = auth.uid() and used = false and expires_at > now()
   order by created_at desc limit 1;
  if rec.id is null then raise exception 'No active verification code. Request a new one.'; end if;
  if _code is null or trim(_code) <> rec.code then raise exception 'Invalid verification code'; end if;
  if rec.amount is not null and _amount is not null and rec.amount <> _amount then
    raise exception 'Verification code does not match this transfer amount';
  end if;
  update public.transfer_otps set used = true where id = rec.id;
end;
$$;

create or replace function public.send_money(_recipient_account text, _amount numeric, _description text default null::text, _reference text default null::text, _otp text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  sender public.profiles%rowtype;
  recipient public.profiles%rowtype;
  grp text := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  perform public.consume_transfer_otp(_otp, _amount);
  perform set_config('app.internal','1',true);

  select * into sender from public.profiles where id = auth.uid() for update;
  select * into recipient from public.profiles where account_number = _recipient_account for update;
  if recipient.id is null then raise exception 'Recipient not found'; end if;
  if recipient.id = sender.id then raise exception 'Cannot send to yourself'; end if;
  if sender.account_status <> 'Active' then raise exception 'Account is % - transfers not allowed', sender.account_status; end if;
  if sender.balance < _amount then raise exception 'Insufficient funds'; end if;

  insert into public.transactions (user_id, group_ref, direction, amount, currency, category, description, narration, counterparty_user_id, counterparty_name, counterparty_account, counterparty_bank, status)
  values (sender.id, grp, 'debit', _amount, sender.currency, 'internal_transfer', _description, _reference, recipient.id, recipient.full_name, recipient.account_number, 'Heritage Bank', 'completed');

  insert into public.transactions (user_id, group_ref, direction, amount, currency, category, description, narration, counterparty_user_id, counterparty_name, counterparty_account, counterparty_bank, status)
  values (recipient.id, grp, 'credit', _amount, recipient.currency, 'incoming_transfer', _description, _reference, sender.id, sender.full_name, sender.account_number, 'Heritage Bank', 'completed');

  insert into public.notifications (user_id, title, body, kind) values
    (sender.id, 'Transfer sent', 'You sent ' || _amount::text || ' to ' || recipient.full_name, 'debit'),
    (recipient.id, 'Money received', 'You received ' || _amount::text || ' from ' || sender.full_name, 'credit');

  perform set_config('app.internal','0',true);
  return jsonb_build_object('group_ref', grp, 'recipient_name', recipient.full_name);
end;
$function$;

create or replace function public.bank_transfer(_amount numeric, _fee numeric, _bank_name text, _account_number text, _account_name text, _narration text default null::text, _country text default null::text, _swift text default null::text, _iban text default null::text, _currency text default null::text, _purpose text default null::text, _kind text default 'local'::text, _otp text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  sender public.profiles%rowtype;
  txid uuid;
  ref text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  perform public.consume_transfer_otp(_otp, _amount);
  perform set_config('app.internal','1',true);
  select * into sender from public.profiles where id = auth.uid() for update;
  if sender.account_status <> 'Active' then raise exception 'Account is % - transfers not allowed', sender.account_status; end if;
  if sender.balance < (_amount + coalesce(_fee,0)) then raise exception 'Insufficient funds'; end if;

  insert into public.transactions (user_id, direction, amount, fee, currency, category, description, narration,
    counterparty_name, counterparty_account, counterparty_bank, counterparty_country, swift_code, iban, purpose, status)
  values (sender.id, 'debit', _amount, coalesce(_fee,0), coalesce(_currency, sender.currency),
    case when _kind = 'international' then 'international_transfer' else 'bank_transfer' end,
    _narration, _narration, _account_name, _account_number, _bank_name, _country, _swift, _iban, _purpose, 'completed')
  returning id, reference into txid, ref;

  insert into public.notifications (user_id, title, body, kind)
  values (sender.id, 'Bank transfer completed', 'Sent ' || _amount::text || ' to ' || _account_name || ' (' || _bank_name || ')', 'debit');

  perform set_config('app.internal','0',true);
  return jsonb_build_object('id', txid, 'reference', ref);
end;
$function$;

drop function if exists public.send_money(text, numeric, text, text);
drop function if exists public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text);