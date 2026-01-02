"use client";

import { FinalExamQuestion } from "@prisma/client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FinalExamQuestionsFormProps {
  initialData: FinalExamQuestion[];
  courseId: string;
  finalExamId: string;
}

interface QuestionFormData {
  title: string;
  explanation?: string;
  options: string[];
  correctAnswer: number;
  points: number;
}

export const FinalExamQuestionsForm = ({
  initialData,
  courseId,
  finalExamId,
}: FinalExamQuestionsFormProps) => {
  const router = useRouter();
  const [questions, setQuestions] = useState<FinalExamQuestion[]>(initialData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FinalExamQuestion | null>(null);
  
  const [formData, setFormData] = useState<QuestionFormData>({
    title: "",
    explanation: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
  });

  useEffect(() => {
    setQuestions(initialData);
  }, [initialData]);

  const resetForm = () => {
    setFormData({
      title: "",
      explanation: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 1,
    });
    setEditingQuestion(null);
  };

  const openDialog = (question?: FinalExamQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        title: question.title,
        explanation: question.explanation || "",
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        points: question.points,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || formData.options.some(opt => !opt.trim())) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsLoading(true);
      
      if (editingQuestion) {
        await axios.patch(`/api/courses/${courseId}/final-exams/${finalExamId}/questions/${editingQuestion.id}`, {
          ...formData,
          options: formData.options.filter(opt => opt.trim()),
        });
        toast.success("Question updated successfully");
      } else {
        const position = questions.length;
        await axios.post(`/api/courses/${courseId}/final-exams/${finalExamId}/questions`, {
          ...formData,
          position,
          options: formData.options.filter(opt => opt.trim()),
        });
        toast.success("Question added successfully");
      }
      
      closeDialog();
      router.refresh();
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    try {
      await axios.delete(`/api/courses/${courseId}/final-exams/${finalExamId}/questions/${questionId}`);
      toast.success("Question deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete question");
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium">
          Questions ({questions.length})
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="ghost" 
              onClick={() => openDialog()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingQuestion ? "Edit Question" : "Add New Question"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Question Title *</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="explanation">Explanation (optional)</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Explain the correct answer..."
                  rows={2}
                />
              </div>

              <div>
                <Label>Answer Options *</Label>
                <div className="space-y-2">
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="text-sm font-medium w-8">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="correctAnswer">Correct Answer</Label>
                  <Select 
                    value={formData.correctAnswer.toString()} 
                    onValueChange={(value) => setFormData({ ...formData, correctAnswer: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select correct answer" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.options.map((_, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          Option {String.fromCharCode(65 + index)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? "Saving..." : (editingQuestion ? "Update" : "Add Question")}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No questions added yet. Click &quot;Add Question&quot; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question, index) => (
            <div
              key={question.id}
              className={cn(
                "flex items-start justify-between p-4 bg-slate-100 border rounded-md"
              )}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Q{index + 1}</Badge>
                  <Badge variant="secondary">{question.points} pts</Badge>
                </div>
                <h4 className="font-medium text-sm mb-2">{question.title}</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  {question.options.map((option, optIndex) => (
                    <div key={optIndex} className="flex items-center gap-1">
                      <span className={cn(
                        "font-medium",
                        optIndex === question.correctAnswer ? "text-green-600" : "text-gray-500"
                      )}>
                        {String.fromCharCode(65 + optIndex)}.
                      </span>
                      <span className={cn(
                        optIndex === question.correctAnswer ? "text-green-600 font-medium" : ""
                      )}>
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDialog(question)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(question.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};