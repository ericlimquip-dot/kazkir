import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "email",
  "magiclink",
  "signup",
  "invite",
  "recovery",
  "email_change",
];

/**
 * Sign-ins land here in one of two forms:
 * - `?code=…` from Google (PKCE; must finish in the same browser that started it)
 * - `?token_hash=…&type=email` from the email link (works in any browser or device;
 *   requires the Magic Link email template to append these parameters, see docs/setup.md)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let failure: string | null = "missing code or token";

  if (tokenHash && type && EMAIL_OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failure = error ? `verifyOtp: ${error.code ?? ""} ${error.message}` : null;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failure = error ? `exchangeCode: ${error.code ?? ""} ${error.message}` : null;
  }

  if (!failure) return NextResponse.redirect(`${origin}${next}`);

  console.warn(`[auth/callback] sign-in failed — ${failure}`);
  return NextResponse.redirect(`${origin}/login?error=1&next=${encodeURIComponent(next)}`);
}
