"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  Settings,
  FileQuestion,
  ClipboardCheck
} from "lucide-react";
import Link from "next/link";

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
}

interface TeacherSetupGuideProps {
  courseId: string;
  steps: SetupStep[];
}

export const TeacherSetupGuide = ({ courseId, steps }: TeacherSetupGuideProps) => {
  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const isCompleted = completedSteps === totalSteps;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Course Setup Required</CardTitle>
          <Badge variant={isCompleted ? "default" : "secondary"}>
            {completedSteps}/{totalSteps} Complete
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete these steps to enable the final exam and certification for your students
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start space-x-3 p-3 rounded-lg border">
            <div className="flex-shrink-0 mt-0.5">
              {step.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                  <span className="text-xs text-gray-500">{index + 1}</span>
                </div>
              )}
            </div>
            <div className="flex-grow">
              <h4 className={`font-medium ${step.completed ? 'text-green-800' : 'text-gray-900'}`}>
                {step.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              {step.action && !step.completed && (
                <Link href={step.action.href}>
                  <Button size="sm" className="mt-2">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    {step.action.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}
        
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center">
              <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Setup Complete!</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Your students can now access the final exam and earn certificates upon completion.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};