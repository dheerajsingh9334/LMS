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
import { BookOpen } from "lucide-react";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import toast from "react-hot-toast";

const TeacherRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
});

export const TeacherRegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof TeacherRegisterSchema>>({
    resolver: zodResolver(TeacherRegisterSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof TeacherRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      register({ ...values, userType: "TEACHER" }).then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          toast.success(data.success);
          form.reset();
          setTimeout(() => router.push("/auth/teacher/login"), 1000);
        }
      });
    });
  };

  return (
    <AuthFormLayout
      icon={BookOpen}
      title="Teacher Registration"
      subtitle="Create your account and start teaching"
      bgGradient="from-purple-50 to-pink-100"
      iconBg="bg-purple-500"
      footerLinks={[
        {
          text: "Already have an account?",
          linkText: "Sign In",
          href: "/auth/teacher/login",
          color: "text-purple-600 hover:text-purple-700",
        },
        {
          text: "Are you a student?",
          linkText: "Register as Student",
          href: "/auth/student/register",
          color: "text-blue-600 hover:text-blue-700",
        },
      ]}
      backHref="/auth/teacher/login"
      backLinkClass="text-gray-600 hover:text-gray-900"
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
                      placeholder="Dr. Jane Smith"
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
                      placeholder="teacher@example.com"
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

          <FormError message={error} />
          <FormSuccess message={success} />

          <Button
            disabled={isPending}
            type="submit"
            className="w-full h-11 bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isPending ? "Creating account..." : "Register as Teacher"}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};
