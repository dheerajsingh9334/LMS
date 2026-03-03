import crypto from "crypto";
import { db } from "@/lib/db";
import { getVerificationTokenByEmail } from "@/data/verification-token";

/**
 * Generates a secure verification token for email confirmation.
 * Deletes any existing token for the same email before creating a new one.
 */
export const generateVerificationToken = async (email: string) => {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

  // Delete existing token for this email
  const existingToken = await getVerificationTokenByEmail(email);
  if (existingToken) {
    await db.verificationToken.delete({ where: { id: existingToken.id } });
  }

  return await db.verificationToken.create({
    data: { email, token, expires },
  });
};
