"use client";

import * as z from "zod";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
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
import { login } from "@/actions/login";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { GraduationCap, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export const LoginForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
      userType: "STUDENT",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(() => {
      login(values)
        .then((data) => {
          if (data?.error) {
            setError(data.error);
          }
          if (data?.success) {
            setSuccess(data.success);
            // Redirect to the path returned by the server
            if (data.redirectTo) {
              setTimeout(() => {
                router.push(data.redirectTo);
                router.refresh();
              }, 500);
            }
          }
        })
        .catch(() => setError("Something went wrong!"));
    });
  };

  return (
    <CardWrapper
      headerLabel="Welcome back!"
      backButtonLabel="Don't have an account?"
      backButtonHref="/auth/register"
      showSocial
      type="signIn"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="userType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">
                    Login as
                  </FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => field.onChange("STUDENT")}
                        className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          field.value === "STUDENT"
                            ? "border-primary bg-primary/5"
                            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <Users className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Student</span>
                      </div>
                      <div
                        onClick={() => field.onChange("TEACHER")}
                        className={`flex flex-col items-center justify-between rounded-lg border-2 p-4 cursor-pointer transition-all ${
                          field.value === "TEACHER"
                            ? "border-primary bg-primary/5"
                            : "border-muted bg-popover hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <GraduationCap className="mb-3 h-6 w-6" />
                        <span className="text-sm font-medium">Teacher</span>
                      </div>
                    </div>
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
                      placeholder="john.doe@example.com"
                      type="email"
                      autoComplete="email"
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
                      placeholder="******"
                      type="password"
                      autoComplete="current-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} type="submit" className="w-full">
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>
    </CardWrapper>
  );
};

