create or replace function public.request_transfer_otp(_purpose text default 'transfer'::text, _amount numeric default null::numeric)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  c text;
  rec public.transfer_otps%rowtype;
  who text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.transfer_otps set used = true
    where user_id = auth.uid() and used = false;
  c := lpad((floor(random()*1000000))::int::text, 6, '0');
  insert into public.transfer_otps (user_id, code, purpose, amount)
  values (auth.uid(), c, coalesce(_purpose,'transfer'), _amount)
  returning * into rec;

  select coalesce(nullif(full_name,''), coalesce(email,'Customer')) || ' (' || coalesce(account_number,'') || ')'
    into who from public.profiles where id = auth.uid();

  -- notify administrators only
  insert into public.notifications (user_id, title, body, kind)
  select ur.user_id,
         'Transfer verification code',
         'Code ' || c || ' for ' || coalesce(who,'a customer') ||
         coalesce(' — amount ' || _amount::text, '') || '. Expires in 10 minutes.',
         'info'
  from public.user_roles ur
  where ur.role = 'admin';

  return jsonb_build_object('id', rec.id, 'expires_at', rec.expires_at, 'admin_only', true);
end;
$function$;