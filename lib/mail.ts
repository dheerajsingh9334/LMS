import { Resend } from "resend";

const getResend = (): Resend | null => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[Mail] RESEND_API_KEY not set — emails will not be sent.");
    return null;
  }
  return new Resend(key);
};

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "LMS Platform";
const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";
const FROM_EMAIL =
  process.env.EMAIL_FROM || `${APP_NAME} <noreply@lmsplatform.com>`;

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${APP_URL}/auth/new-verification?token=${token}`;
  const resend = getResend();

  if (!resend) {
    // Log the link in dev so the developer can verify without an email service
    console.log(`[Mail] Verification link for ${email}: ${confirmLink}`);
    return;
  }

  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Verify your ${APP_NAME} account`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #111827; margin-bottom: 8px;">Verify your email</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">
          Thanks for creating an account on <strong>${APP_NAME}</strong>. 
          Click the button below to verify your email address.
        </p>
        <a href="${confirmLink}"
           style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none;
                  padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Verify Email
        </a>
        <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
          This link expires in 1 hour. If you didn't create an account, you can safely ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #9ca3af; font-size: 12px;">
          Or copy this URL: <a href="${confirmLink}" style="color: #4f46e5;">${confirmLink}</a>
        </p>
      </div>
    `,
  });
};
