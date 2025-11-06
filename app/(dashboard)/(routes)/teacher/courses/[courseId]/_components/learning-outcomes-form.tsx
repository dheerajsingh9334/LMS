"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Plus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Course } from "@prisma/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LearningOutcomesFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  learningOutcomes: z.array(z.string().min(1, "Outcome cannot be empty")),
});

export const LearningOutcomesForm = ({
  initialData,
  courseId
}: LearningOutcomesFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [outcomes, setOutcomes] = useState<string[]>(
    initialData?.learningOutcomes || []
  );
  const [newOutcome, setNewOutcome] = useState("");

  const toggleEdit = () => setIsEditing((current) => !current);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      learningOutcomes: initialData?.learningOutcomes || [],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const addOutcome = () => {
    if (newOutcome.trim()) {
      const updatedOutcomes = [...outcomes, newOutcome.trim()];
      setOutcomes(updatedOutcomes);
      setNewOutcome("");
      form.setValue("learningOutcomes", updatedOutcomes);
    }
  };

  const removeOutcome = (index: number) => {
    const updatedOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(updatedOutcomes);
    form.setValue("learningOutcomes", updatedOutcomes);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values);
      toast.success("Learning outcomes updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        What you&apos;ll learn
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit outcomes
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <>
          {outcomes.length === 0 ? (
            <p className="text-sm text-slate-500 italic mt-2">
              No learning outcomes added yet
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {outcomes.map((outcome, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <span>{outcome}</span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newOutcome}
                  onChange={(e) => setNewOutcome(e.target.value)}
                  placeholder="e.g., Master the fundamentals of React"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addOutcome();
                    }
                  }}
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={addOutcome}
                  variant="outline"
                  size="icon"
                  disabled={!newOutcome.trim() || isSubmitting}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {outcomes.length > 0 && (
                <div className="space-y-2 mt-4">
                  {outcomes.map((outcome, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between gap-2 p-3 bg-white rounded-md border"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span className="text-sm">{outcome}</span>
                      </div>
                      <Button
                        type="button"
                        onClick={() => removeOutcome(index)}
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-x-2">
              <Button
                disabled={outcomes.length === 0 || isSubmitting}
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
