"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { UserRole, UserType } from "@prisma/client";
import { getUserByEmail } from "@/data/user";

export const admin = async () => {
  return { error: "Admin features removed" };
};

const AdminRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  secret: z.string().min(1),
});

export const registerAdmin = async (
  values: z.infer<typeof AdminRegisterSchema>
) => {
  const validated = AdminRegisterSchema.safeParse(values);

  if (!validated.success) {
    return { error: "Invalid fields!" };
  }

  const { name, email, password, secret } = validated.data;

  if (!process.env.ADMIN_SIGNUP_SECRET) {
    return { error: "Admin signup is not configured." };
  }

  if (secret !== process.env.ADMIN_SIGNUP_SECRET) {
    return { error: "Invalid admin secret!" };
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
      userType: UserType.TEACHER,
    },
  });

  return { success: "Admin account created successfully! Please login." };
};
