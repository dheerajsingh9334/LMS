"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const formSchema = z.object({
  title: z.string().min(1, {
    message: "Title is required",
  }),
});

interface FinalExamTitleFormProps {
  courseId: string;
}

export const FinalExamTitleForm = ({
  courseId,
}: FinalExamTitleFormProps) => {
  const router = useRouter();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/final-exams`, values);
      router.push(`/teacher/courses/${courseId}/final-exams/${response.data.id}`);
      toast.success("Final exam created");
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Final exam title
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 mt-4"
        >
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Title
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isSubmitting}
                    placeholder="e.g. 'Final Examination for Advanced Programming'"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Give your final exam a clear title
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center gap-x-2">
            <Link href={`/teacher/courses/${courseId}/final-exams`}>
              <Button
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={!isValid || isSubmitting}
            >
              Continue
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};