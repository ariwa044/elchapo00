
create or replace function public.consume_transfer_otp(_code text, _amount numeric)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare rec public.transfer_otps%rowtype; cleaned text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  cleaned := regexp_replace(coalesce(_code,''), '\s', '', 'g');
  if length(cleaned) = 0 then raise exception 'Enter the verification code'; end if;

  select * into rec from public.transfer_otps
   where user_id = auth.uid()
     and used = false
     and expires_at > now()
     and regexp_replace(code, '\s', '', 'g') = cleaned
   order by created_at desc limit 1;

  if rec.id is null then
    if exists (select 1 from public.transfer_otps
                where user_id = auth.uid()
                  and regexp_replace(code, '\s', '', 'g') = cleaned) then
      raise exception 'That code has already been used or has expired. Request a new one.';
    end if;
    raise exception 'Invalid verification code';
  end if;

  update public.transfer_otps set used = true where id = rec.id;
end;
$function$;

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

  -- reuse a still-valid recent code instead of invalidating it
  select * into rec from public.transfer_otps
   where user_id = auth.uid() and used = false and expires_at > now() + interval '2 minutes'
   order by created_at desc limit 1;

  if rec.id is null then
    c := lpad((floor(random()*1000000))::int::text, 6, '0');
    insert into public.transfer_otps (user_id, code, purpose, amount)
    values (auth.uid(), c, coalesce(_purpose,'transfer'), _amount)
    returning * into rec;
  else
    c := rec.code;
  end if;

  select coalesce(nullif(full_name,''), coalesce(email,'Customer')) || ' (' || coalesce(account_number,'') || ')'
    into who from public.profiles where id = auth.uid();

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
