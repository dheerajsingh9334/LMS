"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import toast from "react-hot-toast";
import { Pencil, Video, Link as LinkIcon } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";

interface PromoVideoFormProps {
  initialData: {
    id: string;
    promoVideoUrl: string | null;
    promoVideoType?: string | null;
  };
  courseId: string;
}

const formSchema = z.object({
  promoVideoUrl: z.string().min(1, "Video is required"),
  promoVideoType: z.enum(["uploaded", "link"]).optional(),
});

export const PromoVideoForm = ({
  initialData,
  courseId,
}: PromoVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const [uploadType, setUploadType] = useState<"upload" | "link">(
    initialData.promoVideoType === "uploaded" ? "upload" : "link"
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      promoVideoUrl: initialData.promoVideoUrl || "",
      promoVideoType: initialData.promoVideoType as "uploaded" | "link" || "link",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, {
        promoVideoUrl: values.promoVideoUrl || null,
        promoVideoType: values.promoVideoType || uploadType,
      });
      toast.success("Promo video updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Course Promo Video
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit video URL
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div className={cn(
          "text-sm mt-2",
          !initialData.promoVideoUrl && "text-slate-500 italic"
        )}>
          {!initialData.promoVideoUrl && "No promo video"}
          {initialData.promoVideoUrl && (
            <div className="space-y-2">
              <p className="text-slate-700 break-all">{initialData.promoVideoUrl}</p>
              <p className="text-xs text-slate-500">
                This video will appear as a preview on the course overview page
              </p>
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
            <Tabs defaultValue={uploadType} onValueChange={(value) => setUploadType(value as "upload" | "link")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Upload Video
                </TabsTrigger>
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Video URL
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <FormField
                  control={form.control}
                  name="promoVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <FileUpload
                          endpoint="promoVideo"
                          onChange={(url) => {
                            if (url) {
                              field.onChange(url);
                              form.setValue("promoVideoType", "uploaded");
                            }
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500 mt-2">
                        Upload a video file (up to 256MB). This will be stored in our database.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="link" className="space-y-4">
                <FormField
                  control={form.control}
                  name="promoVideoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          disabled={isSubmitting}
                          placeholder="e.g., https://www.youtube.com/watch?v=..."
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            form.setValue("promoVideoType", "link");
                          }}
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500 mt-2">
                        Enter a YouTube, Vimeo, or direct video URL. This will be displayed as a preview 
                        on the course landing page for students to watch before enrolling.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center gap-x-2">
              <Button
                disabled={!isValid || isSubmitting}
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
