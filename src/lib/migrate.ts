/**
 * Migration server functions for applying database changes
 * 
 * Since we don't have direct SQL execution through the Supabase REST API,
 * this provides the SQL content and instructions for manual execution.
 */

import { createServerFn } from '@tanstack/react-start';

interface MigrationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Migration SQL content (embedded to avoid file system access issues)
const MIGRATIONS = {
  otpsTable: `
CREATE TABLE IF NOT EXISTS public.otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_user_id ON public.otps(user_id);
CREATE INDEX IF NOT EXISTS idx_otps_code ON public.otps(code);
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_otps_user_expires ON public.otps(user_id, expires_at);

ALTER TABLE public.otps ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own OTPs" ON public.otps
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own OTPs" ON public.otps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own OTPs" ON public.otps
    FOR UPDATE USING (auth.uid() = user_id);
`,

  otpFunctions: `
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
    IF (
        SELECT COUNT(*)
        FROM public.otps
        WHERE user_id = _user_id
        AND created_at > NOW() - INTERVAL '10 minutes'
    ) >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Too many OTP requests. Please wait 10 minutes.');
    END IF;

    _otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    _expires_at := NOW() + INTERVAL '10 minutes';

    INSERT INTO public.otps (user_id, code, expires_at, transaction_id)
    VALUES (_user_id, _otp_code, _expires_at, _transaction_id)
    RETURNING id INTO _otp_id;

    SELECT email INTO _user_email
    FROM auth.users
    WHERE id = _user_id;

    _result := jsonb_build_object(
        'success', true,
        'otp_id', _otp_id,
        'code', _otp_code,
        'expires_at', _expires_at,
        'email', _user_email
    );

    RAISE NOTICE 'OTP for %: % (expires at %)', _user_email, _otp_code, _expires_at;

    RETURN _result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION verify_otp(
    _user_id UUID,
    _code TEXT,
    _transaction_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    _otp_record RECORD;
BEGIN
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

    UPDATE public.otps
    SET used = TRUE
    WHERE id = _otp_record.id;

    RETURN jsonb_build_object('success', true, 'otp_id', _otp_record.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_otp(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_otp(UUID, TEXT, UUID) TO authenticated;
`,

  modifyTransferFunctions: `
CREATE OR REPLACE FUNCTION public.send_money(
    _recipient_account text, 
    _amount numeric, 
    _description text default null, 
    _reference text default null,
    _otp_code text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  recipient public.profiles%rowtype;
  grp text := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  otp_result jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  
  otp_result := public.verify_otp(auth.uid(), _otp_code, null);
  if not (otp_result->>'success')::boolean then
    raise exception 'Invalid or expired OTP';
  end if;
  
  perform set_config('app.internal','1',true);

  select * into sender from public.profiles where id = auth.uid() for update;
  select * into recipient from public.profiles where account_number = _recipient_account for update;
  if recipient.id is null then raise exception 'Recipient not found'; end if;
  if recipient.id = sender.id then raise exception 'Cannot send to yourself'; end if;
  if sender.account_status <> 'Active' then raise exception 'Account is % - transfers not allowed', sender.account_status; end if;
  if sender.balance < _amount then raise exception 'Insufficient funds'; end if;

  insert into public.transactions (user_id, group_ref, direction, amount, currency, category, description, narration, counterparty_user_id, counterparty_name, counterparty_account, counterparty_bank, status)
  values (sender.id, grp, 'debit', _amount, sender.currency, 'internal_transfer', _description, _reference, recipient.id, recipient.full_name, recipient.account_number, 'Heritage Bank', 'completed');

  insert into public.transactions (user_id, group_ref, direction, amount, currency, category, description, narration, counterparty_user_id, counterparty_name, counterparty_account, counterparty_bank, status)
  values (recipient.id, grp, 'credit', _amount, recipient.currency, 'incoming_transfer', _description, _reference, sender.id, sender.full_name, sender.account_number, 'Heritage Bank', 'completed');

  insert into public.notifications (user_id, title, body, kind) values
    (sender.id, 'Transfer sent', 'You sent ' || _amount::text || ' to ' || recipient.full_name, 'debit'),
    (recipient.id, 'Money received', 'You received ' || _amount::text || ' from ' || sender.full_name, 'credit');

  perform set_config('app.internal','0',true);
  return jsonb_build_object('group_ref', grp, 'recipient_name', recipient.full_name);
end;
$$;

revoke all on function public.send_money(text, numeric, text, text, text) from anon, public;
grant execute on function public.send_money(text, numeric, text, text, text) to authenticated;

CREATE OR REPLACE FUNCTION public.bank_transfer(
  _amount numeric, _fee numeric, _bank_name text, _account_number text, _account_name text,
  _narration text default null, _country text default null, _swift text default null,
  _iban text default null, _currency text default null, _purpose text default null, _kind text default 'local',
  _otp_code text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  sender public.profiles%rowtype;
  txid uuid;
  ref text;
  otp_result jsonb;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Invalid amount'; end if;
  
  otp_result := public.verify_otp(auth.uid(), _otp_code, null);
  if not (otp_result->>'success')::boolean then
    raise exception 'Invalid or expired OTP';
  end if;
  
  perform set_config('app.internal','1',true);
  select * into sender from public.profiles where id = auth.uid() for update;
  if sender.account_status <> 'Active' then raise exception 'Account is % - transfers not allowed', sender.account_status; end if;
  if sender.balance < (_amount + coalesce(_fee,0)) then raise exception 'Insufficient funds'; end if;

  insert into public.transactions (user_id, direction, amount, fee, currency, category, description, narration,
    counterparty_name, counterparty_account, counterparty_bank, counterparty_country, swift_code, iban, purpose, status)
  values (sender.id, 'debit', _amount, coalesce(_fee,0), coalesce(_currency, sender.currency),
    case when _kind = 'international' then 'international_transfer' else 'bank_transfer' end,
    _narration, _narration, _account_name, _account_number, _bank_name, _country, _swift, _iban, _purpose, 'completed')
  returning id, reference into txid, ref;

  insert into public.notifications (user_id, title, body, kind)
  values (sender.id, 'Bank transfer completed', 'Sent ' || _amount::text || ' to ' || _account_name || ' (' || _bank_name || ')', 'debit');

  perform set_config('app.internal','0',true);
  return jsonb_build_object('id', txid, 'reference', ref);
end;
$$;

revoke all on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text, text) from anon, public;
grant execute on function public.bank_transfer(numeric, numeric, text, text, text, text, text, text, text, text, text, text, text) to authenticated;
`
};

export const getMigrationSql = createServerFn({ method: 'GET' })
  .validator((data: { migrationName: keyof typeof MIGRATIONS }) => data)
  .handler(async ({ data }) => {
    return {
      success: true,
      sql: MIGRATIONS[data.migrationName],
      migrationName: data.migrationName,
    };
  });

export const checkMigrationStatus = createServerFn({ method: 'GET' })
  .handler(async () => {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        return { success: false, status: {} };
      }

      // Check if otps table exists
      const tableCheck = await fetch(`${supabaseUrl}/rest/v1/otps?select=id&limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      const tableExists = tableCheck.status !== 404;

      // Check if functions exist by trying to call them
      const status = {
        otpsTable: tableExists,
        otpFunctions: false, // Can't easily check via REST API
        transferFunctions: false, // Can't easily check via REST API
      };

      return { success: true, status };
    } catch (error) {
      console.error('Status check error:', error);
      return { success: false, status: {} };
    }
  });
