"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

interface Testimonial {
  id: string;
  studentName: string;
  studentRole: string | null;
  content: string;
  rating: number;
  imageUrl: string | null;
  isFeatured: boolean;
}

interface TestimonialsManagementProps {
  courseId: string;
  testimonials: Testimonial[];
}

export const TestimonialsManagement = ({
  courseId,
  testimonials: initialTestimonials,
}: TestimonialsManagementProps) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [isAdding, setIsAdding] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    studentName: "",
    studentRole: "",
    content: "",
    rating: 5,
    imageUrl: "",
    isFeatured: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();

  const handleAdd = async () => {
    if (!newTestimonial.studentName || !newTestimonial.content) {
      toast.error("Please fill in student name and testimonial content");
      return;
    }

    try {
      setIsSubmitting(true);
      await axios.post(`/api/courses/${courseId}/testimonials`, newTestimonial);
      
      toast.success("Testimonial added successfully");
      setIsAdding(false);
      setNewTestimonial({
        studentName: "",
        studentRole: "",
        content: "",
        rating: 5,
        imageUrl: "",
        isFeatured: false,
      });
      router.refresh();
    } catch (error) {
      toast.error("Failed to add testimonial");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (testimonialId: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) {
      return;
    }

    try {
      await axios.delete(`/api/courses/${courseId}/testimonials/${testimonialId}`);
      toast.success("Testimonial deleted");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete testimonial");
      console.error(error);
    }
  };

  const handleToggleFeatured = async (testimonialId: string, isFeatured: boolean) => {
    try {
      await axios.patch(`/api/courses/${courseId}/testimonials/${testimonialId}`, {
        isFeatured: !isFeatured,
      });
      toast.success(isFeatured ? "Removed from featured" : "Added to featured");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update testimonial");
      console.error(error);
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between mb-4">
        Student Testimonials
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm">
          {isAdding ? "Cancel" : <><Plus className="h-4 w-4 mr-2" /> Add Testimonial</>}
        </Button>
      </div>

      {isAdding && (
        <Card className="p-4 mb-4 bg-white">
          <h4 className="font-semibold mb-3">Add New Testimonial</h4>
          <div className="space-y-3">
            <Input
              placeholder="Student Name *"
              value={newTestimonial.studentName}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, studentName: e.target.value })}
              disabled={isSubmitting}
            />
            <Input
              placeholder="Student Role (e.g., Software Engineer)"
              value={newTestimonial.studentRole}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, studentRole: e.target.value })}
              disabled={isSubmitting}
            />
            <Textarea
              placeholder="Testimonial Content *"
              value={newTestimonial.content}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
              rows={4}
              disabled={isSubmitting}
            />
            <Input
              placeholder="Student Image URL (optional)"
              value={newTestimonial.imageUrl}
              onChange={(e) => setNewTestimonial({ ...newTestimonial, imageUrl: e.target.value })}
              disabled={isSubmitting}
            />
            <div className="flex items-center gap-2">
              <span className="text-sm">Rating:</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((num) => (
                  <Star
                    key={num}
                    className={`w-5 h-5 cursor-pointer ${
                      num <= newTestimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-300"
                    }`}
                    onClick={() => setNewTestimonial({ ...newTestimonial, rating: num })}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={newTestimonial.isFeatured}
                onCheckedChange={(checked) =>
                  setNewTestimonial({ ...newTestimonial, isFeatured: checked as boolean })
                }
                disabled={isSubmitting}
              />
              <label className="text-sm">Featured (show on course landing page)</label>
            </div>
            <Button onClick={handleAdd} disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Adding..." : "Add Testimonial"}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {testimonials.length === 0 && (
          <p className="text-sm text-slate-500 italic">No testimonials yet</p>
        )}
        {testimonials.map((testimonial) => (
          <Card key={testimonial.id} className="p-4 bg-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{testimonial.studentName}</h4>
                  {testimonial.isFeatured && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
                {testimonial.studentRole && (
                  <p className="text-sm text-slate-600 mb-2">{testimonial.studentRole}</p>
                )}
                <p className="text-sm text-slate-700 mb-2">&ldquo;{testimonial.content}&rdquo;</p>
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-slate-200 text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleToggleFeatured(testimonial.id, testimonial.isFeatured)}
                  variant="outline"
                  size="sm"
                >
                  {testimonial.isFeatured ? "Unfeature" : "Feature"}
                </Button>
                <Button
                  onClick={() => handleDelete(testimonial.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
