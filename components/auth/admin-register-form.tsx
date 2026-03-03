"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
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
import { Shield } from "lucide-react";
import { registerAdmin } from "@/actions/admin";
import { AuthFormLayout } from "@/components/auth/auth-form-layout";
import toast from "react-hot-toast";

const AdminRegisterSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  password: z.string().min(6, { message: "Minimum 6 characters required" }),
  secret: z.string().min(1, { message: "Admin secret is required" }),
});

export const AdminRegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminRegisterSchema>>({
    resolver: zodResolver(AdminRegisterSchema),
    defaultValues: { name: "", email: "", password: "", secret: "" },
  });

  const onSubmit = (values: z.infer<typeof AdminRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerAdmin(values).then((data) => {
        if (data?.error) {
          setError(data.error);
          toast.error(data.error);
        }
        if (data?.success) {
          setSuccess(data.success);
          toast.success(data.success);
          form.reset();
        }
      });
    });
  };

  return (
    <AuthFormLayout
      icon={Shield}
      title="Admin Registration"
      subtitle="Create an administrator account with a valid secret key"
      bgGradient="from-slate-900 via-slate-800 to-slate-900"
      iconBg="bg-slate-900"
      footerLinks={[
        {
          text: "Already an admin?",
          linkText: "Sign In",
          href: "/admin/auth",
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Admin Name"
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
            <FormField
              control={form.control}
              name="secret"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Secret</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      disabled={isPending}
                      placeholder="Enter admin secret key"
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
            className="w-full h-11 bg-slate-900 hover:bg-slate-800"
            size="lg"
          >
            {isPending ? "Creating account..." : "Register as Admin"}
          </Button>
        </form>
      </Form>
    </AuthFormLayout>
  );
};
