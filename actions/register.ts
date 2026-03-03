"use server";

import * as z from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { UserRole } from "@prisma/client";
import { eventBus, EventName } from "@/lib/events";
import "@/lib/events/init";

export const register = async (
  values: z.infer<typeof RegisterSchema>,
  callbackUrl?: string | null,
) => {
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

  try {
    await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        userType: userType as any,
      },
    });
  } catch (error: any) {
    if (error?.code === "P2002") {
      return { error: "Email already in use!" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  // If teacher, also add to Teacher table
  if (userType === "TEACHER") {
    await db.teacher.create({
      data: {
        email,
      },
    });
  }

  // Emit welcome event for new user
  const newUser = await getUserByEmail(email);
  if (newUser) {
    eventBus.emit(EventName.USER_WELCOME, {
      userId: newUser.id,
      userName: name,
      email,
      timestamp: new Date(),
      triggeredBy: newUser.id,
    });
  }

  return { success: "Account created successfully!" };
};
