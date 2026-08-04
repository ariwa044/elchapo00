-- Payment PIN: users must create a 4-digit PIN before their first transfer
create extension if not exists pgcrypto with schema extensions;

alter table public.profiles
  add column if not exists pin_hash text,
  add column if not exists pin_set_at timestamptz,
  add column if not exists pin_failed_attempts int not null default 0,
  add column if not exists pin_locked_until timestamptz;

-- Status: does the signed-in user already have a PIN? (never returns the hash)
create or replace function public.payment_pin_status()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'has_pin', (p.pin_hash is not null),
    'locked_until', p.pin_locked_until,
    'failed_attempts', p.pin_failed_attempts
  )
  from public.profiles p
  where p.id = auth.uid();
$$;

revoke all on function public.payment_pin_status() from anon, public;
grant execute on function public.payment_pin_status() to authenticated;

-- Create the PIN (first time only)
create or replace function public.set_payment_pin(_pin text, _confirm_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  existing text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _pin is null or _pin !~ '^[0-9]{4}$' then raise exception 'PIN must be exactly 4 digits'; end if;
  if _pin <> _confirm_pin then raise exception 'PINs do not match'; end if;
  if _pin in ('0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','1122','2580')
    then raise exception 'That PIN is too easy to guess. Choose another.'; end if;

  select pin_hash into existing from public.profiles where id = auth.uid();
  if existing is not null then raise exception 'A payment PIN already exists. Use change_payment_pin.'; end if;

  update public.profiles
    set pin_hash = extensions.crypt(_pin, extensions.gen_salt('bf', 10)),
        pin_set_at = now(),
        pin_failed_attempts = 0,
        pin_locked_until = null
  where id = auth.uid();

  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.set_payment_pin(text, text) from anon, public;
grant execute on function public.set_payment_pin(text, text) to authenticated;

-- Change an existing PIN (requires the current PIN)
create or replace function public.change_payment_pin(_current_pin text, _new_pin text, _confirm_pin text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  ok boolean;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  select (pin_hash is not null and pin_hash = extensions.crypt(_current_pin, pin_hash))
    into ok from public.profiles where id = auth.uid();
  if not coalesce(ok, false) then raise exception 'Current PIN is incorrect'; end if;
  if _new_pin !~ '^[0-9]{4}$' then raise exception 'PIN must be exactly 4 digits'; end if;
  if _new_pin <> _confirm_pin then raise exception 'PINs do not match'; end if;

  update public.profiles
    set pin_hash = extensions.crypt(_new_pin, extensions.gen_salt('bf', 10)),
        pin_set_at = now(), pin_failed_attempts = 0, pin_locked_until = null
  where id = auth.uid();
  return jsonb_build_object('success', true);
end;
$$;

revoke all on function public.change_payment_pin(text, text, text) from anon, public;
grant execute on function public.change_payment_pin(text, text, text) to authenticated;

-- Internal guard used by the transfer functions. Raises on failure.
create or replace function public.assert_payment_pin(_pin text)
returns void language plpgsql security definer set search_path = public as $$
declare
  p public.profiles%rowtype;
begin
  select * into p from public.profiles where id = auth.uid() for update;
  if p.pin_hash is null then raise exception 'PIN_NOT_SET'; end if;
  if p.pin_locked_until is not null and p.pin_locked_until > now() then
    raise exception 'PIN_LOCKED';
  end if;

  if _pin is null or p.pin_hash <> extensions.crypt(_pin, p.pin_hash) then
    update public.profiles
      set pin_failed_attempts = pin_failed_attempts + 1,
          pin_locked_until = case when pin_failed_attempts + 1 >= 5 then now() + interval '15 minutes' else null end
    where id = p.id;
    raise exception 'Incorrect payment PIN';
  end if;

  update public.profiles set pin_failed_attempts = 0, pin_locked_until = null where id = p.id;
end;
$$;

revoke all on function public.assert_payment_pin(text) from anon, public;
grant execute on function public.assert_payment_pin(text) to authenticated;
