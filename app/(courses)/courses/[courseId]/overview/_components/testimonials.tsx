"use client";

import { Star } from "lucide-react";
import Image from "next/image";

interface Testimonial {
  id: string;
  studentName: string;
  studentRole?: string | null;
  content: string;
  rating: number;
  imageUrl?: string | null;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export const Testimonials = ({ testimonials }: TestimonialsProps) => {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        Student Success Stories
      </h2>
      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start gap-4">
              {testimonial.imageUrl ? (
                <Image
                  src={testimonial.imageUrl}
                  alt={testimonial.studentName}
                  width={56}
                  height={56}
                  className="rounded-full"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">
                    {testimonial.studentName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900">
                      {testimonial.studentName}
                    </h4>
                    {testimonial.studentRole && (
                      <p className="text-sm text-slate-600">
                        {testimonial.studentRole}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
                <p className="text-slate-700 text-sm leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
