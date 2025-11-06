"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Plus, 
  X, 
  Users, 
  CheckCircle, 
  Clock,
  Send,
  Trash2
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  isActive: boolean;
  createdAt: Date;
}

interface TeacherPollsProps {
  courseId: string;
  liveSessionId: string;
  isVisible: boolean;
  onClose: () => void;
}

export const TeacherPolls = ({ courseId, liveSessionId, isVisible, onClose }: TeacherPollsProps) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPoll, setNewPoll] = useState({
    question: "",
    options: ["", ""]
  });

  if (!isVisible) return null;

  const addOption = () => {
    setNewPoll(prev => ({
      ...prev,
      options: [...prev.options, ""]
    }));
  };

  const removeOption = (index: number) => {
    if (newPoll.options.length > 2) {
      setNewPoll(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setNewPoll(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const createPoll = async () => {
    if (!newPoll.question.trim() || newPoll.options.some(opt => !opt.trim())) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await axios.post(`/api/courses/${courseId}/live/${liveSessionId}/polls`, {
        question: newPoll.question,
        options: newPoll.options.filter(opt => opt.trim())
      });

      const createdPoll: Poll = {
        id: response.data.id,
        question: newPoll.question,
        options: newPoll.options.map((text, index) => ({
          id: `opt-${index}`,
          text,
          votes: 0
        })),
        totalVotes: 0,
        isActive: true,
        createdAt: new Date()
      };

      setPolls(prev => [createdPoll, ...prev]);
      setNewPoll({ question: "", options: ["", ""] });
      setIsCreating(false);
      toast.success("Poll created successfully!");
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
    }
  };

  const endPoll = async (pollId: string) => {
    try {
      await axios.patch(`/api/courses/${courseId}/live/${liveSessionId}/polls/${pollId}/end`);
      
      setPolls(prev => prev.map(poll => 
        poll.id === pollId ? { ...poll, isActive: false } : poll
      ));
      toast.success("Poll ended");
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error("Failed to end poll");
    }
  };

  const deletePoll = async (pollId: string) => {
    try {
      await axios.delete(`/api/courses/${courseId}/live/${liveSessionId}/polls/${pollId}`);
      
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      toast.success("Poll deleted");
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-900/95 backdrop-blur-md border-l border-white/10 z-40 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-white" />
            <h3 className="text-lg font-semibold text-white">Live Polls</h3>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create New Poll Button */}
        {!isCreating && (
          <Button
            onClick={() => setIsCreating(true)}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Poll
          </Button>
        )}

        {/* Create Poll Form */}
        {isCreating && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm">Create Poll</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder="Enter your question..."
                  value={newPoll.question}
                  onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
                  className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-gray-400">Options:</p>
                {newPoll.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                    />
                    {newPoll.options.length > 2 && (
                      <Button
                        onClick={() => removeOption(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {newPoll.options.length < 5 && (
                <Button
                  onClick={addOption}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Option
                </Button>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={createPoll}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Launch Poll
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewPoll({ question: "", options: ["", ""] });
                  }}
                  variant="ghost"
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Polls */}
        {polls.length === 0 && !isCreating && (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No polls created yet</p>
            <p className="text-sm text-gray-500">Create your first poll to engage students</p>
          </div>
        )}

        {polls.map((poll) => (
          <Card key={poll.id} className={`bg-gray-800/50 border-gray-700 ${poll.isActive ? 'border-green-500/50' : 'border-gray-600'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-white font-medium text-sm mb-1">{poll.question}</h4>
                  <div className="flex items-center gap-2">
                    {poll.isActive ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                        <Clock className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-gray-600/50 text-gray-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ended
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {poll.totalVotes} votes
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  {poll.isActive && (
                    <Button
                      onClick={() => endPoll(poll.id)}
                      variant="ghost"
                      size="sm"
                      className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    onClick={() => deletePoll(poll.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {poll.options.map((option, index) => {
                const percentage = poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;
                return (
                  <div key={option.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">{option.text}</span>
                      <span className="text-xs text-gray-500">
                        {option.votes} ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <Progress 
                      value={percentage} 
                      className="h-2 bg-gray-700"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default TeacherPolls;