"use client";

import { CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PrerequisitesProps {
  prerequisites: string[];
}

export const Prerequisites = ({ prerequisites }: PrerequisitesProps) => {
  if (!prerequisites || prerequisites.length === 0) return null;

  return (
    <Card className="border-2 border-amber-200 bg-amber-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-amber-600" />
          Prerequisites
        </CardTitle>
        <CardDescription>
          What you need to know before starting this course
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {prerequisites.map((prerequisite, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
              <span className="text-slate-700">{prerequisite}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
