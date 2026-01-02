"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface QuestionCardProps {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  title: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  repliesCount: number;
  isResolved: boolean;
  createdAt: Date;
  chapterTitle?: string;
  currentUserId: string;
  onUpvote: (id: string) => void;
  onDownvote: (id: string) => void;
  onResolve?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick: () => void;
}

export const QuestionCard = ({
  id,
  userId,
  userName,
  userImage,
  title,
  content,
  upvotes,
  downvotes,
  repliesCount,
  isResolved,
  createdAt,
  chapterTitle,
  currentUserId,
  onUpvote,
  onDownvote,
  onResolve,
  onEdit,
  onDelete,
  onClick,
}: QuestionCardProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userId === currentUserId;
  const hasUpvoted = upvotes.includes(currentUserId);
  const hasDownvoted = downvotes.includes(currentUserId);
  const score = upvotes.length - downvotes.length;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(id);
    } catch (error) {
      console.error("Error deleting question:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader onClick={onClick}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={userImage} />
              <AvatarFallback>{userName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base">{title}</CardTitle>
                {isResolved && (
                  <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="h-3 w-3" />
                    Resolved
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {userName} • {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
                {chapterTitle && ` • ${chapterTitle}`}
              </CardDescription>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(id);
                }}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Question</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this question? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent onClick={onClick} className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onUpvote(id);
              }}
              className={cn(
                "h-8 px-2",
                hasUpvoted && "text-green-600 hover:text-green-700"
              )}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">{score > 0 ? `+${score}` : score}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDownvote(id);
              }}
              className={cn(
                "h-8 px-2",
                hasDownvoted && "text-red-600 hover:text-red-700"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>{repliesCount} {repliesCount === 1 ? "reply" : "replies"}</span>
          </div>
          {isOwner && !isResolved && repliesCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onResolve?.(id);
              }}
              className="ml-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Resolved
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
