import type { Category, Course } from "@prisma/client";

// Shared course type with progress, category, and related metadata
export type CourseWithProgressWithCategory = Course & {
  category: Category | null;
  chapters: { id: string }[];
  purchases?: { id: string }[];
  user?: {
    id: string;
    name: string | null;
    image: string | null;
    headline: string | null;
  } | null;
  ratings?: {
    rating: number;
  }[];
  progress: number | null;
};
