
drop policy if exists "Users can look up recipients" on public.profiles;

create or replace function public.find_recipient(_query text)
returns table (id uuid, full_name text, username text, account_number text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.username, p.account_number
  from public.profiles p
  where auth.uid() is not null
    and p.id <> auth.uid()
    and length(coalesce(_query,'')) >= 3
    and (p.account_number = _query
      or lower(p.username) = lower(_query)
      or lower(p.full_name) like '%' || lower(_query) || '%')
  limit 10
$$;

revoke all on function public.find_recipient(text) from anon, public;
grant execute on function public.find_recipient(text) to authenticated;

revoke all on function public.send_money(text, numeric, text, text) from anon, public;
grant execute on function public.send_money(text, numeric, text, text) to authenticated;

revoke all on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text) from anon, public;
grant execute on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text) to authenticated;

revoke all on function public.has_role(uuid, public.app_role) from anon, public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

revoke all on function public.apply_transaction_balance() from anon, public, authenticated;
revoke all on function public.issue_default_card() from anon, public, authenticated;
revoke all on function public.grant_admin_for_known_email() from anon, public, authenticated;
revoke all on function public.handle_new_user() from anon, public, authenticated;
revoke all on function public.set_updated_at() from anon, public, authenticated;
