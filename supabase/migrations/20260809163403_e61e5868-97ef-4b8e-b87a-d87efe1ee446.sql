create or replace function public.grant_admin_for_known_email()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if lower(new.email) = 'nelsonthunder100@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end;
$function$;