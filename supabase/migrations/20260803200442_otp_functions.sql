-- Generate OTP function
CREATE OR REPLACE FUNCTION generate_otp(
    _user_id UUID,
    _transaction_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    _otp_code TEXT;
    _expires_at TIMESTAMPTZ;
    _otp_id UUID;
    _user_email TEXT;
    _result JSONB;
BEGIN
    -- Check rate limiting: max 3 OTPs in last 10 minutes
    IF (
        SELECT COUNT(*)
        FROM public.otps
        WHERE user_id = _user_id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many OTP requests. Please wait 10 minutes.');
    END IF;

    -- Generate 6-digit random code
    _otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    _expires_at := NOW() + INTERVAL '10 minutes';

    -- Insert OTP into database
    INSERT INTO public.otps (user_id, code, expires_at, transaction_id)
    VALUES (_user_id, _otp_code, _expires_at, _transaction_id)
    RETURNING id INTO _otp_id;

    -- Get user email for sending OTP
    SELECT email INTO _user_email
    FROM auth.users
    WHERE id = _user_id;

    -- TODO: Send email with OTP
    -- For now, we'll return the code in the response for development
    -- In production, this should call an email service and not return the code
    _result := jsonb_build_object(
        'success', true,
        'otp_id', _otp_id,
        'code', _otp_code,  -- REMOVE THIS IN PRODUCTION
        'expires_at', _expires_at,
        'email', _user_email
    );

    -- Log OTP for development (remove in production)
    RAISE NOTICE 'OTP for %: % (expires at %)', _user_email, _otp_code, _expires_at;

    RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify OTP function
CREATE OR REPLACE FUNCTION verify_otp(
    _user_id UUID,
    _code TEXT,
    _transaction_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    _otp_record RECORD;
BEGIN
    -- Find valid, unused OTP
    SELECT * INTO _otp_record
    FROM public.otps
    WHERE user_id = _user_id
    AND code = _code
    AND used = FALSE
    AND expires_at > NOW()
    AND (_transaction_id IS NULL OR transaction_id = _transaction_id OR transaction_id IS NULL)
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired OTP');
    END IF;

    -- Mark OTP as used
    UPDATE public.otps
    SET used = TRUE
    WHERE id = _otp_record.id;

    RETURN jsonb_build_object('success', true, 'otp_id', _otp_record.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION generate_otp(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_otp(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_otps() TO authenticated;
