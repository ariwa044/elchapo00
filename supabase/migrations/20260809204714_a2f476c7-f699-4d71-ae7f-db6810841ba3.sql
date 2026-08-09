create or replace function public.consume_transfer_otp(_code text, _amount numeric default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare cleaned text;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  cleaned := regexp_replace(coalesce(_code,''), '\s', '', 'g');
  if length(cleaned) = 0 then raise exception 'Enter your transfer PIN'; end if;
  if cleaned <> '200412' then raise exception 'Incorrect transfer PIN'; end if;
end;
$$;