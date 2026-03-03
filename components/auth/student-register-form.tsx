"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";

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
import { register } from "@/actions/register";
import { GraduationCap } from "lucide-react";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import toast from "react-hot-toast";

const StudentRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
  rollNo: z.string().optional(),
});

export const StudentRegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof StudentRegisterSchema>>({
    resolver: zodResolver(StudentRegisterSchema),
    defaultValues: { name: "", email: "", password: "", rollNo: "" },
  });

  const onSubmit = (values: z.infer<typeof StudentRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register({ ...values, userType: "STUDENT" }).then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          toast.success(data.success);
          form.reset();
          setTimeout(() => router.push("/auth/student/login"), 1000);
        }
      });
    });
  };

  return (
    <AuthFormLayout
      icon={GraduationCap}
      title="Student Registration"
      subtitle="Create your account and start learning"
      bgGradient="from-blue-50 to-indigo-100"
      iconBg="bg-blue-500"
      footerLinks={[
        {
          text: "Already have an account?",
          linkText: "Sign In",
          href: "/auth/student/login",
          color: "text-blue-600 hover:text-blue-700",
        },
        {
          text: "Are you a teacher?",
          linkText: "Register as Teacher",
          href: "/auth/teacher/register",
          color: "text-purple-600 hover:text-purple-700",
        },
      ]}
      backHref="/auth/student/login"
      backLinkClass="text-blue-600 hover:text-blue-700"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="John Doe"
                      className="h-11"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
              name="rollNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll Number / Student ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="2024001"
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

          <FormError message={error} />
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isPending ? "Creating account..." : "Register as Student"}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};
