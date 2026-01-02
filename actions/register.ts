"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { UserRole } from "@prisma/client";

export const register = async (values: z.infer<typeof RegisterSchema>, callbackUrl?: string | null) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, name, userType } = validatedFields.data;

  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await getUserByEmail(email);

  if (existingUser) {
    return { error: "Email already in use!" };
  }

  // Determine role based on user type
  const role = userType === "TEACHER" ? UserRole.TEACHER : UserRole.USER;

  await db.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
  // rollNo is not stored on the User model in the current schema
  // If roll numbers are required, store them in a separate student profile collection
      role,
      userType: userType as any, // Type assertion to handle UserType enum
    },
  });

  // If teacher, also add to Teacher table
  if (userType === "TEACHER") {
    await db.teacher.create({
      data: {
        email,
      },
    });
  }

  return { success: "Account created successfully! Please login." };
};
