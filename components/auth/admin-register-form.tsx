"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
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
import { Shield } from "lucide-react";
import { registerAdmin } from "@/actions/admin";

const AdminRegisterSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z.string().email({
    message: "Valid email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  secret: z.string().min(1, {
    message: "Admin secret is required",
  }),
});

export const AdminRegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof AdminRegisterSchema>>({
    resolver: zodResolver(AdminRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      secret: "",
    },
  });

  const onSubmit = (values: z.infer<typeof AdminRegisterSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      registerAdmin(values).then((data) => {
        if (data?.error) {
          setError(data.error);
        }

        if (data?.success) {
          setSuccess(data.success);
          form.reset();
        }
      });
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
              Admin Registration
            </h1>
            <p className="text-gray-600">
              Create an administrator account with a valid secret key.
            </p>
          </div>

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

          <div className="mt-6 text-center text-sm text-gray-600">
            Already an admin?{" "}
            <Link
              href="/admin/auth"
              className="font-semibold text-slate-900 hover:text-slate-700"
            >
              Sign In
            </Link>
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
