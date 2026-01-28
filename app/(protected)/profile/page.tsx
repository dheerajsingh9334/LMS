"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "react-hot-toast";
import { Loader2, Plus, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FileUpload } from "@/components/file-upload";

type ProfileFormValues = {
  name: string;
  image?: string;
  // Student
  dateOfBirth?: string;
  gender?: string;
  // Teacher
  headline?: string;
  bio?: string;
};

export default function ProfilePage() {
  const user = useCurrentUser();
  const { update } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    website: "",
    github: "",
  });

  const form = useForm<ProfileFormValues>({
    defaultValues: {
      name: "",
      image: "",
      dateOfBirth: "",
      gender: "",
      headline: "",
      bio: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        form.reset({
          name: data.name || "",
          image: data.image || "",
          dateOfBirth: data.dateOfBirth
            ? String(data.dateOfBirth).split("T")[0]
            : "",
          gender: data.gender || "",
          headline: data.headline || "",
          bio: data.bio || "",
        });
        setAchievements(data.achievements || []);
        setSocialLinks(
          data.socialLinks || {
            linkedin: "",
            twitter: "",
            website: "",
            github: "",
          },
        );
      } catch (err) {
        console.error("[PROFILE_GET]", err);
      }
    };
    if (user) fetchProfile();
  }, [user, form]);

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements((prev) => [...prev, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: any = { ...values };
      if (user?.userType === "STUDENT") {
        payload.dateOfBirth = values.dateOfBirth || null;
        payload.gender = values.gender || null;
      }
      if (user?.userType === "TEACHER") {
        payload.headline = values.headline || "";
        payload.bio = values.bio || "";
        payload.achievements = achievements;
        payload.socialLinks = socialLinks;
      }

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update");

      // Update the session to reflect new image
      await update();

      toast.success("Profile updated successfully!");

      // Refresh to show updated image in navbar
      window.location.reload();
    } catch (err) {
      console.error("[PROFILE_UPDATE]", err);
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            {user.userType === "STUDENT"
              ? "Manage your student profile"
              : "Manage your instructor profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <Label>Avatar</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage
                        src={form.getValues("image") || undefined}
                        alt={form.getValues("name") || ""}
                      />
                      <AvatarFallback>
                        {(form.getValues("name") || "U").slice(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <FileUpload
                    endpoint="courseImage"
                    allowedTypes={["image"]}
                    maxSizeMB={4}
                    onChange={(url) => form.setValue("image", url || "")}
                  />
                </div>

                <div className="md:col-span-2 space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user.userType === "STUDENT" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date of Birth</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Male</SelectItem>
                                <SelectItem value="female">Female</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {user.userType === "TEACHER" && (
                    <div className="space-y-6">
                      <FormField
                        control={form.control}
                        name="headline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Headline</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Senior Web Developer & Instructor"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>About Me</FormLabel>
                            <FormControl>
                              <Textarea
                                rows={5}
                                placeholder="Tell students about yourself..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-2">
                        <Label>Achievements</Label>
                        <div className="flex gap-2">
                          <Input
                            value={newAchievement}
                            onChange={(e) => setNewAchievement(e.target.value)}
                            placeholder="Add an achievement"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addAchievement();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            onClick={addAchievement}
                            size="icon"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="space-y-2 mt-2">
                          {achievements.map((achievement, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-muted p-2 rounded"
                            >
                              <span className="text-sm">{achievement}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAchievement(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />
                      <div className="space-y-4">
                        <Label>Social Links</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="linkedin" className="text-sm">
                              LinkedIn
                            </Label>
                            <Input
                              id="linkedin"
                              value={socialLinks.linkedin}
                              onChange={(e) =>
                                setSocialLinks({
                                  ...socialLinks,
                                  linkedin: e.target.value,
                                })
                              }
                              placeholder="https://linkedin.com/in/username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="twitter" className="text-sm">
                              Twitter
                            </Label>
                            <Input
                              id="twitter"
                              value={socialLinks.twitter}
                              onChange={(e) =>
                                setSocialLinks({
                                  ...socialLinks,
                                  twitter: e.target.value,
                                })
                              }
                              placeholder="https://twitter.com/username"
                            />
                          </div>
                          <div>
                            <Label htmlFor="website" className="text-sm">
                              Website
                            </Label>
                            <Input
                              id="website"
                              value={socialLinks.website}
                              onChange={(e) =>
                                setSocialLinks({
                                  ...socialLinks,
                                  website: e.target.value,
                                })
                              }
                              placeholder="https://yourwebsite.com"
                            />
                          </div>
                          <div>
                            <Label htmlFor="github" className="text-sm">
                              GitHub
                            </Label>
                            <Input
                              id="github"
                              value={socialLinks.github}
                              onChange={(e) =>
                                setSocialLinks({
                                  ...socialLinks,
                                  github: e.target.value,
                                })
                              }
                              placeholder="https://github.com/username"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
