"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, X, Plus } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface FAQFormProps {
  initialData: {
    id: string;
    faqs: string[];
  };
  courseId: string;
}

interface FAQ {
  question: string;
  answer: string;
}

const formSchema = z.object({
  faqs: z.array(z.string()).optional().default([]),
});

export const FAQForm = ({
  initialData,
  courseId,
}: FAQFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Parse FAQs from strings to objects
  const parseFAQs = (faqStrings: string[]): FAQ[] => {
    return faqStrings.map(faqString => {
      try {
        return JSON.parse(faqString);
      } catch {
        return { question: "", answer: "" };
      }
    });
  };

  const [faqs, setFaqs] = useState<FAQ[]>(
    initialData.faqs.length > 0 
      ? parseFAQs(initialData.faqs)
      : [{ question: "", answer: "" }]
  );

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      faqs: initialData.faqs.length > 0 ? initialData.faqs : [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Convert FAQ objects to JSON strings
      const faqStrings = faqs
        .filter(faq => faq.question.trim() !== "" && faq.answer.trim() !== "")
        .map(faq => JSON.stringify(faq));

      await axios.patch(`/api/courses/${courseId}`, {
        faqs: faqStrings,
      });
      toast.success("FAQs updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addFAQ = () => {
    const newFaqs = [...faqs, { question: "", answer: "" }];
    setFaqs(newFaqs);
    // Update form state to trigger validation
    const faqStrings = newFaqs.map(faq => JSON.stringify(faq));
    form.setValue("faqs", faqStrings, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removeFAQ = (index: number) => {
    const newFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(newFaqs);
    // Update form state to trigger validation
    const faqStrings = newFaqs.map(faq => JSON.stringify(faq));
    form.setValue("faqs", faqStrings, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const updateFAQ = (index: number, field: "question" | "answer", value: string) => {
    const newFaqs = [...faqs];
    newFaqs[index][field] = value;
    setFaqs(newFaqs);
    // Update form state to trigger validation
    const faqStrings = newFaqs.map(faq => JSON.stringify(faq));
    form.setValue("faqs", faqStrings, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Frequently Asked Questions
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit FAQs
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.faqs.length && "text-slate-500 italic"
        )}>
          {!initialData.faqs.length && "No FAQs added"}
          {initialData.faqs.length > 0 && (
            <div className="space-y-4">
              {parseFAQs(initialData.faqs).map((faq, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-semibold">{faq.question}</p>
                  <p className="text-slate-600 mt-1">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border rounded-md p-4 bg-white space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-600">
                      FAQ {index + 1}
                    </span>
                    {faqs.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeFAQ(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    disabled={isSubmitting}
                    placeholder="Question"
                    value={faq.question}
                    onChange={(e) => updateFAQ(index, "question", e.target.value)}
                  />
                  <Textarea
                    disabled={isSubmitting}
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                onClick={addFAQ}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
              <Button
                disabled={isSubmitting}
                type="submit"
              >
                Save
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
