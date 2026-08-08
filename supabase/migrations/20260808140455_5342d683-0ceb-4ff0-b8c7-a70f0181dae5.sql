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

insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where lower(email) = 'nelsonthunder100@gmail.com'
on conflict do nothing;

delete from public.user_roles ur
using auth.users u
where ur.user_id = u.id and ur.role = 'admin' and lower(u.email) = 'piofficialreception@gmail.com';