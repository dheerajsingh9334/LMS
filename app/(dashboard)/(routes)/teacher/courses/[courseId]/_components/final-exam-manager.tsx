"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Plus, Eye, Settings, Users, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface FinalExamAttempt {
  id: string;
  score: number;
  passed: boolean;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface FinalExamManagerProps {
  courseId: string;
  finalExamAttempts: FinalExamAttempt[];
}

export const FinalExamManager = ({ courseId, finalExamAttempts }: FinalExamManagerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [examConfig, setExamConfig] = useState({
    title: "",
    description: "",
    timeLimit: 60,
    passingScore: 70,
    questionsCount: 10,
  });

  const passedAttempts = finalExamAttempts.filter(attempt => attempt.passed);
  const failedAttempts = finalExamAttempts.filter(attempt => !attempt.passed);

  const handleCreateExam = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/final-exam/create`, examConfig);
      toast.success("Final exam created successfully!");
      setIsDialogOpen(false);
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      toast.error("Failed to create final exam");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    try {
      setIsLoading(true);
      await axios.post(`/api/courses/${courseId}/final-exam/generate`);
      toast.success("Final exam questions generated successfully!");
    } catch (error) {
      toast.error("Failed to generate questions");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            <CardTitle>Final Exam</CardTitle>
          </div>
          <Badge variant="outline">
            {finalExamAttempts.length} Attempts
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{passedAttempts.length}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failedAttempts.length}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Create/Update Final Exam
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Final Exam Configuration</DialogTitle>
                <DialogDescription>
                  Set up your course final exam parameters
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Exam Title</Label>
                  <Input
                    id="title"
                    value={examConfig.title}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Final Exam"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={examConfig.description}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Course final exam description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={examConfig.timeLimit}
                      onChange={(e) => setExamConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="passingScore">Passing Score (%)</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      value={examConfig.passingScore}
                      onChange={(e) => setExamConfig(prev => ({ ...prev, passingScore: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="questionsCount">Number of Questions</Label>
                  <Input
                    id="questionsCount"
                    type="number"
                    value={examConfig.questionsCount}
                    onChange={(e) => setExamConfig(prev => ({ ...prev, questionsCount: parseInt(e.target.value) }))}
                  />
                </div>
                <Button 
                  onClick={handleCreateExam} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Creating..." : "Create Exam"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={handleGenerateQuestions}
            disabled={isLoading}
            className="w-full"
          >
            <Settings className="w-4 h-4 mr-2" />
            Auto-Generate Questions
          </Button>

          <Button variant="outline" className="w-full">
            <Eye className="w-4 h-4 mr-2" />
            Preview Exam
          </Button>

          <Button variant="outline" className="w-full">
            <Users className="w-4 h-4 mr-2" />
            View Results
          </Button>
        </div>

        {finalExamAttempts.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Recent Attempts</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {finalExamAttempts.slice(0, 5).map((attempt) => (
                <div key={attempt.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    {attempt.passed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 bg-red-600 rounded-full" />
                    )}
                    <span className="text-sm">{attempt.user.name || attempt.user.email}</span>
                  </div>
                  <Badge variant={attempt.passed ? "default" : "destructive"}>
                    {attempt.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};