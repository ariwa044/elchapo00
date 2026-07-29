
create or replace function public.protect_profile_fields()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('app.internal', true), '') = '1' then return new; end if;
  if auth.uid() is null or public.has_role(auth.uid(), 'admin') then return new; end if;
  new.balance := old.balance;
  new.account_number := old.account_number;
  new.customer_id := old.customer_id;
  new.account_status := old.account_status;
  new.credit_score := old.credit_score;
  new.routing_number := old.routing_number;
  new.swift_code := old.swift_code;
  return new;
end;
$$;
revoke all on function public.protect_profile_fields() from anon, public, authenticated;

create trigger trg_profiles_protect
before update on public.profiles
for each row execute function public.protect_profile_fields();

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();
