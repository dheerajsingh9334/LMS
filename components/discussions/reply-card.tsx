"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, CheckCircle2, Edit, Trash2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
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

interface ReplyCardProps {
  id: string;
  userId: string;
  userName: string;
  userImage?: string;
  content: string;
  upvotes: string[];
  downvotes: string[];
  isBestAnswer: boolean;
  createdAt: Date;
  currentUserId: string;
  isQuestionOwner: boolean;
  onUpvote: (id: string) => void;
  onDownvote: (id: string) => void;
  onMarkBest?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ReplyCard = ({
  id,
  userId,
  userName,
  userImage,
  content,
  upvotes,
  downvotes,
  isBestAnswer,
  createdAt,
  currentUserId,
  isQuestionOwner,
  onUpvote,
  onDownvote,
  onMarkBest,
  onEdit,
  onDelete,
}: ReplyCardProps) => {
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
      console.error("Error deleting reply:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card
      className={cn(
        "relative",
        isBestAnswer && "border-green-500 border-2 bg-green-50/50"
      )}
    >
      {isBestAnswer && (
        <div className="absolute top-2 right-2">
          <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
            <Award className="h-3 w-3" />
            Best Answer
          </Badge>
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={userImage} />
              <AvatarFallback>{userName?.[0]?.toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <CardDescription className="text-xs">
              <span className="font-medium text-foreground">{userName}</span>
              <span className="text-muted-foreground">
                {" "}• {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
            </CardDescription>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(id)}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reply</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this reply? This action cannot be undone.
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
      <CardContent className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpvote(id)}
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
              onClick={() => onDownvote(id)}
              className={cn(
                "h-8 px-2",
                hasDownvoted && "text-red-600 hover:text-red-700"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
            </Button>
          </div>
          {isQuestionOwner && !isBestAnswer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkBest?.(id)}
              className="ml-auto text-xs"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Mark as Best Answer
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
