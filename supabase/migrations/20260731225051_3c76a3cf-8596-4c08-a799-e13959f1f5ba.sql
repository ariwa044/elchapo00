-- Let the balance trigger stand down while the admin edit function does its own math
CREATE OR REPLACE FUNCTION public.apply_transaction_balance()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  delta numeric(18,2);
  newbal numeric(18,2);
begin
  if coalesce(current_setting('app.tx_edit', true), '') = '1' then
    new.updated_at := now();
    return new;
  end if;
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
$function$;

CREATE OR REPLACE FUNCTION public.admin_update_transaction(_tx_id uuid, _patch jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  tx public.transactions%rowtype;
  old_delta numeric(18,2) := 0;
  new_delta numeric(18,2) := 0;
  newbal numeric(18,2);
  n_direction text;
  n_amount numeric(18,2);
  n_fee numeric(18,2);
  n_status text;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into tx from public.transactions where id = _tx_id;
  if tx.id is null then raise exception 'Transaction not found'; end if;

  n_direction := coalesce(_patch->>'direction', tx.direction);
  n_amount    := coalesce((_patch->>'amount')::numeric, tx.amount);
  n_fee       := coalesce((_patch->>'fee')::numeric, tx.fee);
  n_status    := coalesce(_patch->>'status', tx.status);
  if n_amount <= 0 then raise exception 'Invalid amount'; end if;
  if n_direction not in ('credit','debit') then raise exception 'Invalid direction'; end if;

  if tx.applied then
    old_delta := case when tx.direction = 'credit' then tx.amount else -(tx.amount + coalesce(tx.fee,0)) end;
  end if;
  if n_status = 'completed' then
    new_delta := case when n_direction = 'credit' then n_amount else -(n_amount + coalesce(n_fee,0)) end;
  end if;

  perform set_config('app.internal','1',true);
  perform set_config('app.tx_edit','1',true);

  update public.profiles
    set balance = balance + (new_delta - old_delta), updated_at = now()
    where id = tx.user_id
    returning balance into newbal;

  update public.transactions set
    direction           = n_direction,
    amount              = n_amount,
    fee                 = n_fee,
    status              = n_status,
    applied             = (n_status = 'completed'),
    balance_after       = case when n_status = 'completed' then newbal else null end,
    currency            = coalesce(_patch->>'currency', currency),
    category            = coalesce(_patch->>'category', category),
    description         = coalesce(_patch->>'description', description),
    narration           = coalesce(_patch->>'narration', narration),
    reference           = coalesce(nullif(_patch->>'reference',''), reference),
    counterparty_name   = coalesce(_patch->>'counterparty_name', counterparty_name),
    counterparty_account= coalesce(_patch->>'counterparty_account', counterparty_account),
    counterparty_bank   = coalesce(_patch->>'counterparty_bank', counterparty_bank),
    counterparty_country= coalesce(_patch->>'counterparty_country', counterparty_country),
    swift_code          = coalesce(_patch->>'swift_code', swift_code),
    iban                = coalesce(_patch->>'iban', iban),
    purpose             = coalesce(_patch->>'purpose', purpose),
    created_at          = coalesce((_patch->>'created_at')::timestamptz, created_at),
    updated_at          = now()
  where id = _tx_id;

  perform set_config('app.tx_edit','0',true);
  perform set_config('app.internal','0',true);

  return jsonb_build_object('id', _tx_id, 'balance', newbal);
end;
$function$;

CREATE OR REPLACE FUNCTION public.admin_delete_transaction(_tx_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare tx public.transactions%rowtype; delta numeric(18,2) := 0;
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Forbidden'; end if;
  select * into tx from public.transactions where id = _tx_id;
  if tx.id is null then raise exception 'Transaction not found'; end if;
  if tx.applied then
    delta := case when tx.direction = 'credit' then -tx.amount else (tx.amount + coalesce(tx.fee,0)) end;
    update public.profiles set balance = balance + delta, updated_at = now() where id = tx.user_id;
  end if;
  perform set_config('app.internal','1',true);
  delete from public.transactions where id = _tx_id;
  perform set_config('app.internal','0',true);
end;
$function$;