-- Modify send_money to require OTP verification
create or replace function public.send_money(
    _recipient_account text, 
    _amount numeric, 
    _description text default null, 
    _reference text default null,
    _otp_code text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
    sender public.profiles%rowtype;
    recipient public.profiles%rowtype;
    grp text := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
    otp_result jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  
  -- Verify OTP before proceeding
  otp_result := public.verify_otp(auth.uid(), _otp_code, null);
  if not (otp_result->>'success')::boolean then
    raise exception 'Invalid or expired OTP';
  end if;
  
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
$$;

revoke all on function public.send_money(text, numeric, text, text, text) from anon, public;
grant execute on function public.send_money(text, numeric, text, text, text) to authenticated;

-- Modify bank_transfer to require OTP verification
create or replace function public.bank_transfer(
  _amount numeric, _fee numeric, _bank_name text, _account_number text, _account_name text,
  _narration text default null, _country text default null, _swift text default null,
  _iban text default null, _currency text default null, _purpose text default null, _kind text default 'local',
  _otp_code text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  txid uuid;
  ref text;
  otp_result jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  
  -- Verify OTP before proceeding
  otp_result := public.verify_otp(auth.uid(), _otp_code, null);
  if not (otp_result->>'success')::boolean then
    raise exception 'Invalid or expired OTP';
  end if;
  
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
$$;

revoke all on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text, text) from anon, public;
grant execute on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
