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
import { cn } from "@/lib/utils";

interface ProjectsFormProps {
  initialData: {
    id: string;
    projectsIncluded: string[];
  };
  courseId: string;
}

const formSchema = z.object({
  projectsIncluded: z.array(z.string()).optional().default([]),
});

export const ProjectsForm = ({
  initialData,
  courseId,
}: ProjectsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [projects, setProjects] = useState<string[]>(
    initialData.projectsIncluded.length > 0 ? initialData.projectsIncluded : [""]
  );

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      projectsIncluded: initialData.projectsIncluded.length > 0 ? initialData.projectsIncluded : [""],
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        projectsIncluded: values.projectsIncluded.filter(p => p.trim() !== ""),
      });
      toast.success("Projects updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  const addProject = () => {
    const newProjects = [...projects, ""];
    setProjects(newProjects);
    form.setValue("projectsIncluded", newProjects, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const removeProject = (index: number) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    form.setValue("projectsIncluded", newProjects, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  const updateProject = (index: number, value: string) => {
    const newProjects = [...projects];
    newProjects[index] = value;
    setProjects(newProjects);
    form.setValue("projectsIncluded", newProjects, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Projects Included
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit projects
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.projectsIncluded.length && "text-slate-500 italic"
        )}>
          {!initialData.projectsIncluded.length && "No projects"}
          {initialData.projectsIncluded.length > 0 && (
            <ol className="list-decimal list-inside space-y-1">
              {initialData.projectsIncluded.map((project, index) => (
                <li key={index}>{project}</li>
              ))}
            </ol>
          )}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormField
              control={form.control}
              name="projectsIncluded"
              render={() => (
                <FormItem>
                  <FormControl>
                    <div className="space-y-2">
                      {projects.map((project, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            disabled={isSubmitting}
                            placeholder={`Project ${index + 1}`}
                            value={project}
                            onChange={(e) => updateProject(index, e.target.value)}
                          />
                          {projects.length > 1 && (
                            <Button
                              type="button"
                              onClick={() => removeProject(index)}
                              variant="ghost"
                              size="sm"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-x-2">
              <Button
                type="button"
                onClick={addProject}
                variant="outline"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add project
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
