"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import toast from "react-hot-toast";

const AdminLoginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
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
    defaultValues: { email: "", password: "" },
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
          toast.error("Invalid credentials!");
          return;
        }

        if (result?.ok) {
          await new Promise((resolve) => setTimeout(resolve, 500));

          const response = await fetch("/api/auth/check-role");
          const data = await response.json();

          if (data.error || data.role !== "ADMIN") {
            setError("This account is not registered as an admin!");
            toast.error("This account is not registered as an admin!");
            return;
          }

          setSuccess("Login successful! Redirecting...");
          toast.success("Login successful!");
          setTimeout(() => {
            window.location.href = callbackUrl || "/admin";
          }, 500);
        }
      } catch {
        setError("Something went wrong!");
        toast.error("Something went wrong!");
      }
    });
  };

  return (
    <AuthFormLayout
      icon={Shield}
      title="Admin Login"
      subtitle="Sign in to manage the platform"
      bgGradient="from-slate-900 via-slate-800 to-slate-900"
      iconBg="bg-slate-900"
      footerLinks={[
        {
          text: "Don't have an admin account?",
          linkText: "Register as Admin",
          href: "/admin/auth/register",
          color: "text-slate-900 hover:text-slate-700",
        },
      ]}
      backLinkClass="text-gray-300 hover:text-white"
    >
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
    </AuthFormLayout>
  );
};
