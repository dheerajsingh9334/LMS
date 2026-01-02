"use client";

import { Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface WhoIsThisForProps {
  audiences: string[];
}

export const WhoIsThisFor = ({ audiences }: WhoIsThisForProps) => {
  if (!audiences || audiences.length === 0) return null;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Who is this course for?
        </CardTitle>
        <CardDescription>
          This course is perfect for:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="flex items-start gap-3 bg-white p-3 rounded-lg border border-blue-200"
            >
              <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 flex-shrink-0" />
              <span className="text-slate-700">{audience}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
