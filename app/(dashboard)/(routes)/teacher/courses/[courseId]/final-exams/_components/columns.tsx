"use client";

import { FinalExam, FinalExamQuestion, FinalExamAttempt } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type FinalExamWithDetails = FinalExam & {
  questions: FinalExamQuestion[];
  attempts: FinalExamAttempt[];
};

export const columns: ColumnDef<FinalExamWithDetails>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Title
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "questions",
    header: "Questions",
    cell: ({ row }) => {
      const questions = row.getValue("questions") as FinalExamQuestion[];
      return (
        <div className="text-center">
          {questions?.length || 0}
        </div>
      );
    },
  },
  {
    accessorKey: "attempts",
    header: "Attempts",
    cell: ({ row }) => {
      const attempts = row.getValue("attempts") as FinalExamAttempt[];
      return (
        <div className="text-center">
          {attempts?.length || 0}
        </div>
      );
    },
  },
  {
    accessorKey: "passingScore",
    header: "Passing Score",
    cell: ({ row }) => {
      const passingScore = row.getValue("passingScore") as number;
      return (
        <div className="text-center">
          {passingScore}%
        </div>
      );
    },
  },
  {
    accessorKey: "timeLimit",
    header: "Time Limit",
    cell: ({ row }) => {
      const timeLimit = row.getValue("timeLimit") as number;
      return (
        <div className="text-center">
          {timeLimit ? `${timeLimit} min` : "No limit"}
        </div>
      );
    },
  },
  {
    accessorKey: "isPublished",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Published
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const isPublished = row.getValue("isPublished") as boolean;

      return (
        <Badge className={cn(
          "bg-slate-500",
          isPublished && "bg-sky-700"
        )}>
          {isPublished ? "Published" : "Draft"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { id, courseId } = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-4 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <Link href={`/teacher/courses/${courseId}/final-exams/${id}`}>
              <DropdownMenuItem>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];