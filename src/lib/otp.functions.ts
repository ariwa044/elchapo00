import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const requestTransferOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { purpose: string; amount: number }) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { error } = await supabase.rpc("request_transfer_otp", {
      _purpose: data.purpose,
      _amount: data.amount,
    });
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: otp } = await supabaseAdmin
      .from("transfer_otps")
      .select("code, expires_at")
      .eq("user_id", userId)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otp) return { emailed: false as const };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email, account_number")
      .eq("id", userId)
      .maybeSingle();

    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const adminIds = (roles ?? []).map((row) => row.user_id);
    const { data: admins } = adminIds.length
      ? await supabaseAdmin.from("profiles").select("email").in("id", adminIds)
      : { data: [] as { email: string | null }[] };

    const recipients = Array.from(
      new Set((admins ?? []).map((row) => row.email).filter((email): email is string => !!email)),
    );
    if (recipients.length === 0) return { emailed: false as const };

    const { sendMail } = await import("@/lib/smtp.server");

    const who = `${profile?.full_name ?? "Customer"} (${profile?.account_number ?? "—"})`;
    const amount = Number(data.amount ?? 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const text = [
      "Heritage Bank — transfer verification code",
      "",
      `Customer: ${who}`,
      `Email: ${profile?.email ?? "—"}`,
      `Purpose: ${data.purpose}`,
      `Amount: ${amount}`,
      "",
      `Verification code: ${otp.code}`,
      `Expires: ${new Date(otp.expires_at as string).toUTCString()}`,
    ].join("\n");

    const html = `
      <div style="font-family:Arial,sans-serif;background:#0b1220;padding:24px;color:#e8eefc">
        <h2 style="color:#d4af37;margin:0 0 12px">Transfer verification code</h2>
        <p style="margin:0 0 16px">A customer requested a transfer and needs a one-time code.</p>
        <table style="font-size:14px;line-height:22px">
          <tr><td style="opacity:.7;padding-right:12px">Customer</td><td>${who}</td></tr>
          <tr><td style="opacity:.7;padding-right:12px">Email</td><td>${profile?.email ?? "—"}</td></tr>
          <tr><td style="opacity:.7;padding-right:12px">Purpose</td><td>${data.purpose}</td></tr>
          <tr><td style="opacity:.7;padding-right:12px">Amount</td><td>${amount}</td></tr>
        </table>
        <p style="font-size:34px;letter-spacing:10px;font-weight:700;color:#d4af37;margin:20px 0">${otp.code}</p>
        <p style="font-size:12px;opacity:.7;margin:0">Expires ${new Date(otp.expires_at as string).toUTCString()}</p>
      </div>`;

    let emailed = true;
    for (const to of recipients) {
      try {
        await sendMail({ to, subject: `Transfer code ${otp.code} — ${who}`, text, html });
      } catch (mailError) {
        emailed = false;
        console.error("OTP email failed", mailError);
      }
    }

    return { emailed };
  });
