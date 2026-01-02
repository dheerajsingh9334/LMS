"use client";

import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Loader2, MessageSquare } from "lucide-react";
import { QuestionCard } from "./question-card";
import { ReplyCard } from "./reply-card";
import { AskQuestion } from "./ask-question";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import toast from "react-hot-toast";

interface Discussion {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  title: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  replies: Reply[];
  isResolved: boolean;
  createdAt: Date;
  chapter?: {
    id: string;
    title: string;
  };
}

interface Reply {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  isBestAnswer: boolean;
  createdAt: Date;
}

interface DiscussionsPanelProps {
  courseId: string;
  chapterId?: string;
  currentUserId: string;
}

export const DiscussionsPanel = ({
  courseId,
  chapterId,
  currentUserId,
}: DiscussionsPanelProps) => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  const fetchDiscussions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (chapterId) params.append("chapterId", chapterId);
      if (filter !== "all") params.append("filter", filter);

      const response = await axios.get(
        `/api/courses/${courseId}/discussions?${params.toString()}`
      );
      setDiscussions(response.data);
    } catch (error) {
      console.error("Error fetching discussions:", error);
      toast.error("Failed to load discussions");
    } finally {
      setIsLoading(false);
    }
  }, [courseId, chapterId, filter]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const handleCreateQuestion = async (title: string, content: string) => {
    try {
      await axios.post(`/api/courses/${courseId}/discussions`, {
        title,
        content,
        chapterId,
      });
      toast.success("Question posted");
      fetchDiscussions();
    } catch (error) {
      console.error("Error creating question:", error);
      toast.error("Failed to post question");
      throw error;
    }
  };

  const handleVoteDiscussion = async (discussionId: string, action: "upvote" | "downvote") => {
    try {
      await axios.patch(`/api/courses/${courseId}/discussions/${discussionId}`, {
        action,
      });
      fetchDiscussions();
      if (selectedDiscussion?.id === discussionId) {
        const updated = await axios.get(`/api/courses/${courseId}/discussions?chapterId=${chapterId}`);
        const found = updated.data.find((d: Discussion) => d.id === discussionId);
        if (found) setSelectedDiscussion(found);
      }
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to vote");
    }
  };

  const handleResolveDiscussion = async (discussionId: string) => {
    try {
      await axios.patch(`/api/courses/${courseId}/discussions/${discussionId}`, {
        action: "resolve",
      });
      toast.success("Question marked as resolved");
      fetchDiscussions();
      setSelectedDiscussion(null);
    } catch (error) {
      console.error("Error resolving discussion:", error);
      toast.error("Failed to resolve question");
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    try {
      await axios.delete(`/api/courses/${courseId}/discussions/${discussionId}`);
      toast.success("Question deleted");
      fetchDiscussions();
      if (selectedDiscussion?.id === discussionId) {
        setSelectedDiscussion(null);
      }
    } catch (error) {
      console.error("Error deleting discussion:", error);
      toast.error("Failed to delete question");
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedDiscussion || !replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      await axios.post(
        `/api/courses/${courseId}/discussions/${selectedDiscussion.id}/replies`,
        { content: replyContent }
      );
      toast.success("Reply posted");
      setReplyContent("");
      
      // Refresh discussion details
      const response = await axios.get(`/api/courses/${courseId}/discussions?chapterId=${chapterId}`);
      const updated = response.data.find((d: Discussion) => d.id === selectedDiscussion.id);
      if (updated) {
        setSelectedDiscussion(updated);
      }
      fetchDiscussions();
    } catch (error) {
      console.error("Error posting reply:", error);
      toast.error("Failed to post reply");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleVoteReply = async (replyId: string, action: "upvote" | "downvote") => {
    if (!selectedDiscussion) return;

    try {
      await axios.patch(
        `/api/courses/${courseId}/discussions/${selectedDiscussion.id}/replies/${replyId}`,
        { action }
      );
      
      // Refresh discussion details
      const response = await axios.get(`/api/courses/${courseId}/discussions?chapterId=${chapterId}`);
      const updated = response.data.find((d: Discussion) => d.id === selectedDiscussion.id);
      if (updated) {
        setSelectedDiscussion(updated);
      }
    } catch (error) {
      console.error("Error voting reply:", error);
      toast.error("Failed to vote");
    }
  };

  const handleMarkBestAnswer = async (replyId: string) => {
    if (!selectedDiscussion) return;

    try {
      await axios.patch(
        `/api/courses/${courseId}/discussions/${selectedDiscussion.id}/replies/${replyId}`,
        { action: "mark-best" }
      );
      toast.success("Marked as best answer");
      
      // Refresh discussion details
      const response = await axios.get(`/api/courses/${courseId}/discussions?chapterId=${chapterId}`);
      const updated = response.data.find((d: Discussion) => d.id === selectedDiscussion.id);
      if (updated) {
        setSelectedDiscussion(updated);
      }
      fetchDiscussions();
    } catch (error) {
      console.error("Error marking best answer:", error);
      toast.error("Failed to mark best answer");
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter discussions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Questions</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <AskQuestion onSubmit={handleCreateQuestion} />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : discussions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              No questions yet. Be the first to ask!
            </p>
          </div>
        ) : (
          discussions.map((discussion) => (
            <QuestionCard
              key={discussion.id}
              id={discussion.id}
              userId={discussion.userId}
              userName={discussion.userName}
              userImage={discussion.userImage}
              title={discussion.title}
              content={discussion.content}
              upvotes={discussion.upvotes}
              downvotes={discussion.downvotes}
              repliesCount={discussion.replies.length}
              isResolved={discussion.isResolved}
              createdAt={discussion.createdAt}
              chapterTitle={discussion.chapter?.title}
              currentUserId={currentUserId}
              onUpvote={(id: string) => handleVoteDiscussion(id, "upvote")}
              onDownvote={(id: string) => handleVoteDiscussion(id, "downvote")}
              onResolve={handleResolveDiscussion}
              onDelete={handleDeleteDiscussion}
              onClick={() => setSelectedDiscussion(discussion)}
            />
          ))
        )}
      </div>

      {/* Discussion Detail Dialog */}
      <Dialog
        open={!!selectedDiscussion}
        onOpenChange={(open) => !open && setSelectedDiscussion(null)}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedDiscussion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedDiscussion.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{selectedDiscussion.content}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Asked by {selectedDiscussion.userName}</span>
                    {selectedDiscussion.chapter && <span>• {selectedDiscussion.chapter.title}</span>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">
                    {selectedDiscussion.replies.length} {selectedDiscussion.replies.length === 1 ? "Reply" : "Replies"}
                  </h3>
                  {selectedDiscussion.replies.map((reply) => (
                    <ReplyCard
                      key={reply.id}
                      id={reply.id}
                      userId={reply.userId}
                      userName={reply.userName}
                      userImage={reply.userImage}
                      content={reply.content}
                      upvotes={reply.upvotes}
                      downvotes={reply.downvotes}
                      isBestAnswer={reply.isBestAnswer}
                      createdAt={reply.createdAt}
                      currentUserId={currentUserId}
                      isQuestionOwner={selectedDiscussion.userId === currentUserId}
                      onUpvote={(id: string) => handleVoteReply(id, "upvote")}
                      onDownvote={(id: string) => handleVoteReply(id, "downvote")}
                      onMarkBest={handleMarkBestAnswer}
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <Textarea
                    placeholder="Write your reply..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={isSubmittingReply}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                    >
                      {isSubmittingReply ? "Posting..." : "Post Reply"}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
