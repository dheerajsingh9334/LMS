"use server";

import * as z from "zod";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn } from "@/auth";
import { LoginSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";

import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

export const login = async (
  values: z.infer<typeof LoginSchema>,
  callbackUrl?: string | null
) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, userType } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser || !existingUser.email || !existingUser.password) {
    return { error: "Email does not exist!" };
  }

  // Validate user type matches
  if (userType === "TEACHER" && existingUser.role !== "TEACHER") {
    return { error: "This account is not registered as a teacher!" };
  }

  if (userType === "STUDENT" && existingUser.role !== "USER") {
    return { error: "This account is not registered as a student!" };
  }

  try {
    // Sign in without redirect - let client handle it
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    // Return success with redirect path based on role
    const redirectPath =
      existingUser.role === "TEACHER" ? "/teacher/courses" : "/dashboard";

    return {
      success: "Login successful!",
      redirectTo: redirectPath,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials!" };
        default:
          return { error: "Something went wrong!" };
      }
    }

    throw error;
  }
};
