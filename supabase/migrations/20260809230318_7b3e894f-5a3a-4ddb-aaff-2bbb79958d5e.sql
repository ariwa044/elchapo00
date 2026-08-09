DROP FUNCTION IF EXISTS public.request_transfer_otp(text, numeric);
DROP FUNCTION IF EXISTS public.request_transfer_otp(numeric, text);
DROP TABLE IF EXISTS public.transfer_otps CASCADE;