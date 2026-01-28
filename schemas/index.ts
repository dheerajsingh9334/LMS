import * as z from "zod";
import { UserRole } from "@prisma/client";

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    role: z.optional(z.enum([UserRole.ADMIN, UserRole.USER, UserRole.TEACHER])),
    email: z.optional(z.string().email()),
    password: z.optional(
      z.string().min(6, {
        message: "Password must be at least 6 characters",
      }),
    ),
    newPassword: z.optional(
      z.string().min(6, {
        message: "New password must be at least 6 characters",
      }),
    ),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }

      return true;
    },
    {
      message: "New password is required!",
      path: ["newPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }

      return true;
    },
    {
      message: "Current password is required!",
      path: ["password"],
    },
  )
  .refine(
    (data) => {
      if (
        data.password &&
        data.newPassword &&
        data.password === data.newPassword
      ) {
        return false;
      }

      return true;
    },
    {
      message: "New password must be different from current password!",
      path: ["newPassword"],
    },
  );

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
  userType: z.enum(["STUDENT", "TEACHER"]).optional().default("STUDENT"),
});

export const RegisterSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  userType: z.enum(["STUDENT", "TEACHER"], {
    required_error: "Please select Student or Teacher",
  }),
  // Student fields
  // Student fields
  rollNo: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other"]).optional(),
  // Teacher fields
  headline: z.string().optional(),
});
