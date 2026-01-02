"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { signIn } from "next-auth/react";
import { Shield } from "lucide-react";

const AdminLoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const AdminLoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminLoginSchema>>({
    resolver: zodResolver(AdminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof AdminLoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid credentials!");
          return;
        }

        if (result?.ok) {
          // Wait a bit for session to update, then check role
          await new Promise((resolve) => setTimeout(resolve, 500));

          const response = await fetch("/api/auth/check-role");
          const data = await response.json();

          if (data.error || data.role !== "ADMIN") {
            setError("This account is not registered as an admin!");
            return;
          }

          setSuccess("Login successful! Redirecting...");
          setTimeout(() => {
            window.location.href = callbackUrl || "/admin";
          }, 500);
        }
      } catch (error) {
        setError("Something went wrong!");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-gray-600">Sign in to manage the platform.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="admin@example.com"
                          type="email"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="••••••••"
                          type="password"
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormError message={error || urlError} />
              <FormSuccess message={success} />

              <Button
                disabled={isPending}
                type="submit"
                className="w-full h-11 bg-slate-900 hover:bg-slate-800"
                size="lg"
              >
                {isPending ? "Signing in..." : "Sign In as Admin"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 space-y-4">
            <div className="text-center text-sm text-gray-600">
              Don&apos;t have an admin account?{" "}
              <Link
                href="/admin/auth/register"
                className="font-semibold text-slate-900 hover:text-slate-700"
              >
                Register as Admin
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-gray-300 hover:text-white underline"
          >
             Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};
