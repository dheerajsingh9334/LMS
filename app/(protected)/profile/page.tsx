"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "react-hot-toast";
import axios from "axios";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";

export default function ProfilePage() {
  const user = useCurrentUser();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Student fields
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  // Teacher fields
  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    twitter: "",
    website: "",
    github: "",
  });

  // Common fields
  const [name, setName] = useState("");
  const [image, setImage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/profile");
        const data = response.data;

        setName(data.name || "");
        setImage(data.image || "");
        setDateOfBirth(data.dateOfBirth ? data.dateOfBirth.split("T")[0] : "");
        setGender(data.gender || "");
        setHeadline(data.headline || "");
        setBio(data.bio || "");
        setAchievements(data.achievements || []);
        setSocialLinks(data.socialLinks || {
          linkedin: "",
          twitter: "",
          website: "",
          github: "",
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await axios.post("/api/upload", formData);
      setImage(response.data.url);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    setAchievements(achievements.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data: any = {
        name,
        image,
      };

      if (user?.userType === "STUDENT") {
        data.dateOfBirth = dateOfBirth || null;
        data.gender = gender || null;
      } else if (user?.userType === "TEACHER") {
        data.headline = headline;
        data.bio = bio;
        data.achievements = achievements;
        data.socialLinks = socialLinks;
      }

      await axios.patch("/api/profile", data);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
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
    <div className="p-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>
            {user.userType === "STUDENT"
              ? "Manage your student profile"
              : "Manage your instructor profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <Label>Profile Picture</Label>
              <div className="flex items-center gap-4">
                {image && (
                  <Image
                    src={image}
                    alt="Profile"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                  />
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Student-specific fields */}
            {user.userType === "STUDENT" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Teacher-specific fields */}
            {user.userType === "TEACHER" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="headline">Professional Headline</Label>
                  <Input
                    id="headline"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g., Senior Web Developer & Instructor"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">About Me</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell students about yourself..."
                    rows={5}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Achievements</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      placeholder="Add an achievement"
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                    />
                    <Button type="button" onClick={addAchievement} size="icon">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
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

                <div className="space-y-4">
                  <Label>Social Media Links</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedin" className="text-sm">LinkedIn</Label>
                      <Input
                        id="linkedin"
                        value={socialLinks.linkedin}
                        onChange={(e) =>
                          setSocialLinks({ ...socialLinks, linkedin: e.target.value })
                        }
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitter" className="text-sm">Twitter</Label>
                      <Input
                        id="twitter"
                        value={socialLinks.twitter}
                        onChange={(e) =>
                          setSocialLinks({ ...socialLinks, twitter: e.target.value })
                        }
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="website" className="text-sm">Website</Label>
                      <Input
                        id="website"
                        value={socialLinks.website}
                        onChange={(e) =>
                          setSocialLinks({ ...socialLinks, website: e.target.value })
                        }
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="github" className="text-sm">GitHub</Label>
                      <Input
                        id="github"
                        value={socialLinks.github}
                        onChange={(e) =>
                          setSocialLinks({ ...socialLinks, github: e.target.value })
                        }
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
