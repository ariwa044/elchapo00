
create or replace function public.guard_customer_transactions()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.internal', true), '') = '1' then
    return new;
  end if;
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then
    return new;
  end if;
  new.status := 'pending';
  new.applied := false;
  new.balance_after := null;
  if new.category not in ('deposit','withdrawal') then
    new.category := 'deposit';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_customer_transactions() from anon, public, authenticated;

create trigger trg_transactions_guard
before insert on public.transactions
for each row execute function public.guard_customer_transactions();

-- mark the official transfer functions as internal
create or replace function public.send_money(_recipient_account text, _amount numeric, _description text default null, _reference text default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  recipient public.profiles%rowtype;
  grp text := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
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

revoke all on function public.send_money(text, numeric, text, text) from anon, public;
grant execute on function public.send_money(text, numeric, text, text) to authenticated;
revoke all on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text) from anon, public;
grant execute on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text) to authenticated;

-- admin: fund / adjust a customer balance by posting a transaction
create or replace function public.admin_adjust_balance(_user_id uuid, _amount numeric, _direction text, _description text default 'Administrative adjustment')
returns jsonb language plpgsql security definer set search_path = public as $$
declare txid uuid; ref text;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  perform set_config('app.internal','1',true);
  insert into public.transactions (user_id, direction, amount, category, description, status, counterparty_name, counterparty_bank)
  values (_user_id, _direction, _amount, case when _direction='credit' then 'deposit' else 'withdrawal' end,
          _description, 'completed', 'Heritage Bank', 'Heritage Bank')
  returning id, reference into txid, ref;
  insert into public.notifications (user_id, title, body, kind)
  values (_user_id, case when _direction='credit' then 'Account funded' else 'Account debited' end, _description, _direction);
  perform set_config('app.internal','0',true);
  return jsonb_build_object('id', txid, 'reference', ref);
end;
$$;
revoke all on function public.admin_adjust_balance(uuid, numeric, text, text) from anon, public;
grant execute on function public.admin_adjust_balance(uuid, numeric, text, text) to authenticated;

-- admin: approve/reject a pending request
create or replace function public.admin_review_transaction(_tx_id uuid, _approve boolean)
returns void language plpgsql security definer set search_path = public as $$
declare tx public.transactions%rowtype;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into tx from public.transactions where id = _tx_id;
  if tx.id is null then raise exception 'Transaction not found'; end if;
  perform set_config('app.internal','1',true);
  update public.transactions set status = case when _approve then 'completed' else 'rejected' end where id = _tx_id;
  insert into public.notifications (user_id, title, body, kind)
  values (tx.user_id, case when _approve then 'Request approved' else 'Request rejected' end,
          coalesce(tx.description, tx.category) || ' — ' || tx.amount::text, tx.direction);
  perform set_config('app.internal','0',true);
end;
$$;
revoke all on function public.admin_review_transaction(uuid, boolean) from anon, public;
grant execute on function public.admin_review_transaction(uuid, boolean) to authenticated;
