
-- ============ ROLES ============
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users can view their own roles" on public.user_roles
for select to authenticated using (auth.uid() = user_id);
create policy "Admins can view all roles" on public.user_roles
for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- ============ PROFILES EXTENSION ============
alter table public.profiles
  add column if not exists phone text,
  add column if not exists state text,
  add column if not exists city text,
  add column if not exists photo_url text,
  add column if not exists customer_id text not null default 'HB' || lpad((floor(random()*100000000))::bigint::text, 8, '0'),
  add column if not exists account_type text not null default 'Savings',
  add column if not exists currency text not null default 'USD',
  add column if not exists account_status text not null default 'Active',
  add column if not exists routing_number text not null default lpad((floor(random()*1000000000))::bigint::text, 9, '0'),
  add column if not exists swift_code text not null default 'HERIUS33XXX',
  add column if not exists iban text,
  add column if not exists credit_score integer not null default 720;

create unique index if not exists profiles_account_number_key on public.profiles(account_number);

create policy "Users can look up recipients" on public.profiles
for select to authenticated using (true);

create policy "Admins can view all profiles" on public.profiles
for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins can update all profiles" on public.profiles
for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ TRANSACTIONS ============
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reference text not null default 'HB' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)),
  group_ref text,
  direction text not null check (direction in ('debit','credit')),
  amount numeric(18,2) not null check (amount > 0),
  fee numeric(18,2) not null default 0,
  currency text not null default 'USD',
  category text not null default 'transfer',
  description text,
  narration text,
  counterparty_user_id uuid,
  counterparty_name text,
  counterparty_account text,
  counterparty_bank text,
  counterparty_country text,
  swift_code text,
  iban text,
  purpose text,
  status text not null default 'completed' check (status in ('pending','completed','failed','rejected','reversed')),
  balance_after numeric(18,2),
  applied boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;

create index transactions_user_created_idx on public.transactions(user_id, created_at desc);

create policy "Users can view own transactions" on public.transactions
for select to authenticated using (auth.uid() = user_id);
create policy "Users can insert own transactions" on public.transactions
for insert to authenticated with check (auth.uid() = user_id);
create policy "Admins can view all transactions" on public.transactions
for select to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "Admins can insert any transaction" on public.transactions
for insert to authenticated with check (public.has_role(auth.uid(),'admin'));
create policy "Admins can update any transaction" on public.transactions
for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "Admins can delete any transaction" on public.transactions
for delete to authenticated using (public.has_role(auth.uid(),'admin'));

-- balance engine
create or replace function public.apply_transaction_balance()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  delta numeric(18,2);
  newbal numeric(18,2);
begin
  if new.status = 'completed' and new.applied = false then
    delta := case when new.direction = 'credit' then new.amount else -(new.amount + coalesce(new.fee,0)) end;
    update public.profiles set balance = balance + delta, updated_at = now()
      where id = new.user_id returning balance into newbal;
    new.balance_after := newbal;
    new.applied := true;
  elsif tg_op = 'UPDATE' and old.applied = true and new.status in ('reversed','rejected','failed') then
    delta := case when new.direction = 'credit' then -new.amount else (new.amount + coalesce(new.fee,0)) end;
    update public.profiles set balance = balance + delta, updated_at = now()
      where id = new.user_id returning balance into newbal;
    new.balance_after := newbal;
    new.applied := false;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_transactions_balance
before insert or update on public.transactions
for each row execute function public.apply_transaction_balance();

-- internal transfer between Heritage Bank users
create or replace function public.send_money(_recipient_account text, _amount numeric, _description text default null, _reference text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  recipient public.profiles%rowtype;
  grp text := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;

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

  return jsonb_build_object('group_ref', grp, 'recipient_name', recipient.full_name);
end;
$$;

-- external transfer (local/international)
create or replace function public.bank_transfer(
  _amount numeric, _fee numeric, _bank_name text, _account_number text, _account_name text,
  _narration text default null, _country text default null, _swift text default null,
  _iban text default null, _currency text default null, _purpose text default null, _kind text default 'local'
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  txid uuid;
  ref text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
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

  return jsonb_build_object('id', txid, 'reference', ref);
end;
$$;

-- ============ BENEFICIARIES ============
create table public.beneficiaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  account_number text not null,
  bank_name text,
  country text,
  swift_code text,
  iban text,
  kind text not null default 'local',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.beneficiaries to authenticated;
grant all on public.beneficiaries to service_role;
alter table public.beneficiaries enable row level security;
create policy "Users manage own beneficiaries" on public.beneficiaries
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============ CARDS ============
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  card_number text not null,
  card_holder text not null,
  expiry_month int not null,
  expiry_year int not null,
  cvv text not null,
  brand text not null default 'Visa',
  card_type text not null default 'Debit',
  status text not null default 'Active',
  design text not null default 'midnight',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.cards to authenticated;
grant all on public.cards to service_role;
alter table public.cards enable row level security;
create policy "Users manage own cards" on public.cards
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins manage all cards" on public.cards
for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  body text,
  kind text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "Users manage own notifications" on public.notifications
for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Admins insert notifications" on public.notifications
for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

-- ============ SIGNUP HOOKS ============
create or replace function public.issue_default_card()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.cards (user_id, card_number, card_holder, expiry_month, expiry_year, cvv)
  values (
    new.id,
    '4' || lpad((floor(random()*1000000000000000))::bigint::text, 15, '0'),
    upper(coalesce(nullif(new.full_name,''), 'HERITAGE CUSTOMER')),
    1 + floor(random()*12)::int,
    extract(year from now())::int + 4,
    lpad((floor(random()*1000))::int::text, 3, '0')
  );
  insert into public.notifications (user_id, title, body, kind)
  values (new.id, 'Welcome to Heritage Bank', 'Your account and Visa debit card are ready.', 'info');
  return new;
end;
$$;

create trigger trg_profiles_default_card
after insert on public.profiles
for each row execute function public.issue_default_card();

create or replace function public.grant_admin_for_known_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'piofficialreception@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_roles
after insert on auth.users
for each row execute function public.grant_admin_for_known_email();

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill existing users
insert into public.user_roles (user_id, role)
select id, 'user'::app_role from auth.users on conflict do nothing;
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where lower(email) = 'piofficialreception@gmail.com' on conflict do nothing;

insert into public.cards (user_id, card_number, card_holder, expiry_month, expiry_year, cvv)
select p.id,
  '4' || lpad((floor(random()*1000000000000000))::bigint::text, 15, '0'),
  upper(coalesce(nullif(p.full_name,''),'HERITAGE CUSTOMER')),
  1 + floor(random()*12)::int,
  extract(year from now())::int + 4,
  lpad((floor(random()*1000))::int::text, 3, '0')
from public.profiles p
where not exists (select 1 from public.cards c where c.user_id = p.id);

-- ============ REALTIME ============
alter table public.profiles replica identity full;
alter table public.transactions replica identity full;
alter table public.cards replica identity full;
alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.transactions;
alter publication supabase_realtime add table public.cards;
alter publication supabase_realtime add table public.notifications;
