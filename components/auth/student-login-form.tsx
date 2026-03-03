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
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { GraduationCap } from "lucide-react";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import toast from "react-hot-toast";

const StudentLoginSchema = z.object({
  email: z.string().email({ message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const StudentLoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError =
    searchParams.get("error") === "OAuthAccountNotLinked"
      ? "Email already in use with different provider!"
      : "";

  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof StudentLoginSchema>>({
    resolver: zodResolver(StudentLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof StudentLoginSchema>) => {
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

          if (data.error || data.userType !== "STUDENT") {
            setError("This account is not registered as a student!");
            toast.error("This account is not registered as a student!");
            return;
          }

          setSuccess("Login successful! Redirecting...");
          toast.success("Login successful!");
          setTimeout(() => {
            window.location.href = callbackUrl || DEFAULT_LOGIN_REDIRECT;
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
      icon={GraduationCap}
      title="Student Login"
      subtitle="Access your courses and continue learning"
      bgGradient="from-blue-50 to-indigo-100"
      iconBg="bg-blue-500"
      footerLinks={[
        {
          text: "Don't have an account?",
          linkText: "Register as Student",
          href: "/auth/student/register",
          color: "text-blue-600 hover:text-blue-700",
        },
        {
          text: "Are you a teacher?",
          linkText: "Teacher Login",
          href: "/auth/teacher/login",
          color: "text-purple-600 hover:text-purple-700",
        },
      ]}
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
                      placeholder="student@example.com"
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
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isPending ? "Signing in..." : "Sign In as Student"}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};
