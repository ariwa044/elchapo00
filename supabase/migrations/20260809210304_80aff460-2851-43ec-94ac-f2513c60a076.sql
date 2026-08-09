DROP FUNCTION IF EXISTS public.request_transfer_otp(text, numeric);
DROP TABLE IF EXISTS public.transfer_otps;

CREATE OR REPLACE FUNCTION public.consume_transfer_otp(_code text, _amount numeric DEFAULT NULL::numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cleaned_pin text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  cleaned_pin := regexp_replace(coalesce(_code, ''), '\s', '', 'g');

  IF length(cleaned_pin) = 0 THEN
    RAISE EXCEPTION 'Enter your transfer PIN';
  END IF;

  IF cleaned_pin <> '200412' THEN
    RAISE EXCEPTION 'Incorrect transfer PIN';
  END IF;
END;
$$;