create or replace function public.request_transfer_otp(_purpose text default 'transfer', _amount numeric default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  c text;
  rec public.transfer_otps%rowtype;
  em text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  update public.transfer_otps set used = true
    where user_id = auth.uid() and used = false;
  c := lpad((floor(random()*1000000))::int::text, 6, '0');
  insert into public.transfer_otps (user_id, code, purpose, amount)
  values (auth.uid(), c, coalesce(_purpose,'transfer'), _amount)
  returning * into rec;
  select coalesce(email,'') into em from public.profiles where id = auth.uid();
  insert into public.notifications (user_id, title, body, kind)
  values (auth.uid(), 'Transfer verification code', 'Your one-time code is ' || c || '. It expires in 10 minutes.', 'info');
  return jsonb_build_object('id', rec.id, 'expires_at', rec.expires_at, 'email', em);
end;
$$;