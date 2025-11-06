"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface FinalExamQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic: string;
}

interface FinalExamManagerProps {
  courseId: string;
}

export function FinalExamManager({ courseId }: FinalExamManagerProps) {
  const [questions, setQuestions] = useState<FinalExamQuestion[]>([]);
  const [examEnabled, setExamEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExamData();
  }, [courseId]);

  const loadExamData = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/final-exam-questions`);
      const data = response.data;
      
      setQuestions(data.finalExamQuestions || []);
      setExamEnabled(data.finalExamEnabled || false);
    } catch (error) {
      console.error("Error loading final exam data:", error);
      toast.error("Failed to load final exam data");
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    const newQuestion: FinalExamQuestion = {
      id: Date.now().toString(),
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
      difficulty: "MEDIUM",
      topic: "",
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof FinalExamQuestion, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    const options = [...updatedQuestions[questionIndex].options];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const validateQuestions = () => {
    for (const question of questions) {
      if (!question.question.trim()) {
        toast.error("All questions must have content");
        return false;
      }
      
      if (question.options.some(opt => !opt.trim())) {
        toast.error("All options must have content");
        return false;
      }
      
      if (!question.topic.trim()) {
        toast.error("All questions must have a topic");
        return false;
      }
    }
    return true;
  };

  const saveExamData = async () => {
    if (questions.length === 0) {
      toast.error("Add at least one question to enable the final exam");
      return;
    }

    if (!validateQuestions()) {
      return;
    }

    setSaving(true);
    try {
      await axios.put(`/api/courses/${courseId}/final-exam-questions`, {
        questions,
        enabled: examEnabled,
      });
      
      toast.success("Final exam saved successfully!");
    } catch (error) {
      console.error("Error saving final exam:", error);
      toast.error("Failed to save final exam");
    } finally {
      setSaving(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'HARD': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="p-6">Loading final exam data...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Final Exam Management</h2>
          <p className="text-sm text-muted-foreground">
            Create and manage the final exam questions for this course
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={examEnabled}
              onCheckedChange={setExamEnabled}
              disabled={questions.length === 0}
            />
            <Label>Enable Final Exam</Label>
          </div>
          
          <Button onClick={saveExamData} disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {examEnabled && questions.length === 0 && (
        <div className="flex items-center p-4 border border-orange-200 bg-orange-50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
          <p className="text-sm text-orange-700">
            Add questions to enable the final exam for students
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getDifficultyColor(question.difficulty)}>
                    {question.difficulty}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Topic</Label>
                  <Input
                    value={question.topic}
                    onChange={(e) => updateQuestion(index, "topic", e.target.value)}
                    placeholder="e.g., React Components, Node.js, etc."
                  />
                </div>
                
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={question.difficulty}
                    onValueChange={(value) => updateQuestion(index, "difficulty", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Question</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(index, "question", e.target.value)}
                  placeholder="Enter your question here..."
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Options</Label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => updateQuestion(index, "correctAnswer", optionIndex)}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      className="flex-1"
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Select the radio button to mark the correct answer
                </p>
              </div>
              
              <div>
                <Label>Explanation (Optional)</Label>
                <Textarea
                  value={question.explanation || ""}
                  onChange={(e) => updateQuestion(index, "explanation", e.target.value)}
                  placeholder="Explain why this is the correct answer..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={addQuestion} variant="outline" size="lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certification Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">65%</div>
              <div className="text-sm text-muted-foreground">Pass Threshold</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">80%</div>
              <div className="text-sm text-muted-foreground">Certificate Eligible</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">90%</div>
              <div className="text-sm text-muted-foreground">Excellence Award</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Students need at least 65% to pass the final exam and unlock certification
          </p>
        </CardContent>
      </Card>
    </div>
  );
}