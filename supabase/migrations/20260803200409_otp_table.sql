-- Create otps table for storing OTP codes
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_otps_user_id ON public.otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_code ON public.otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_user_expires ON public.otps(user_id, expires_at);

-- Enable Row Level Security
ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own OTPs
CREATE POLICY "Users can view own OTPs" ON public.otps
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own OTPs (via RPC)
CREATE POLICY "Users can insert own OTPs" ON public.otps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own OTPs (via RPC)
CREATE POLICY "Users can update own OTPs" ON public.otps
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup to run daily (requires pg_cron extension)
-- This is optional and can be set up later if needed
