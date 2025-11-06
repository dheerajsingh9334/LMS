"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { 
  MoreHorizontal, 
  Play, 
  Square, 
  Edit, 
  Trash2, 
  Calendar,
  Users,
  Clock,
  Video
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { LiveSession } from "@prisma/client";

interface LiveSessionsListProps {
  courseId: string;
  liveSessions: LiveSession[];
}

export const LiveSessionsList = ({ courseId, liveSessions }: LiveSessionsListProps) => {
  const router = useRouter();
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);

  const startLiveSession = async (sessionId: string) => {
    try {
      setLoadingSessionId(sessionId);
      
      await axios.patch(`/api/courses/${courseId}/live/${sessionId}`, {
        isLive: true
      });
      
      toast.success("Live session started!");
      router.refresh();
      
    } catch (error) {
      console.error("Error starting session:", error);
      toast.error("Failed to start live session");
    } finally {
      setLoadingSessionId(null);
    }
  };

  const stopLiveSession = async (sessionId: string) => {
    try {
      setLoadingSessionId(sessionId);
      
      await axios.patch(`/api/courses/${courseId}/live/${sessionId}`, {
        isLive: false
      });
      
      toast.success("Live session ended!");
      router.refresh();
      
    } catch (error) {
      console.error("Error stopping session:", error);
      toast.error("Failed to stop live session");
    } finally {
      setLoadingSessionId(null);
    }
  };

  const deleteLiveSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this live session?")) return;
    
    try {
      setLoadingSessionId(sessionId);
      
      await axios.delete(`/api/courses/${courseId}/live/${sessionId}`);
      
      toast.success("Live session deleted!");
      router.refresh();
      
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete live session");
    } finally {
      setLoadingSessionId(null);
    }
  };

  const getStatusBadge = (session: LiveSession) => {
    if (session.isLive) {
      return <Badge className="bg-red-500 text-white animate-pulse">🔴 Live</Badge>;
    }
    
    if (session.endedAt) {
      return <Badge variant="secondary">⏰ Ended</Badge>;
    }
    
    return <Badge variant="secondary">💤 Inactive</Badge>;
  };

  if (liveSessions.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
        <Video className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-600 mb-2">No Live Sessions</h3>
        <p className="text-slate-500 mb-4">
          Create your first live session to start engaging with your students in real-time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveSessions.map((session) => (
              <TableRow key={session.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{session.title}</p>
                    {session.description && (
                      <p className="text-sm text-slate-500 truncate max-w-xs">
                        {session.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  {getStatusBadge(session)}
                </TableCell>
                
                <TableCell>
                  {session.startedAt ? (
                    <div className="text-sm">
                      <p>{format(new Date(session.startedAt), "MMM dd, yyyy")}</p>
                      <p className="text-slate-500">{format(new Date(session.startedAt), "h:mm a")}</p>
                    </div>
                  ) : (
                    <span className="text-slate-400">Not started</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="text-sm">
                    <p>{format(new Date(session.createdAt), "MMM dd, yyyy")}</p>
                    <p className="text-slate-500">{format(new Date(session.createdAt), "h:mm a")}</p>
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {/* Quick Actions */}
                    {!session.isLive ? (
                      <Button
                        size="sm"
                        onClick={() => startLiveSession(session.id)}
                        disabled={loadingSessionId === session.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </Button>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/teacher/courses/${courseId}/live-sessions/${session.id}/stream`)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Video className="h-4 w-4 mr-1" />
                          Stream
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => stopLiveSession(session.id)}
                          disabled={loadingSessionId === session.id}
                        >
                          <Square className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      </>
                    )}

                    {/* More Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/teacher/courses/${courseId}/live-sessions/${session.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Session
                        </DropdownMenuItem>
                        
                        {session.isLive && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/teacher/courses/${courseId}/live-sessions/${session.id}/stream`)}
                          >
                            <Video className="mr-2 h-4 w-4" />
                            Start Streaming
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem
                          onClick={() => deleteLiveSession(session.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Session
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      <div className="text-xs text-muted-foreground">
        💡 Tip: Students can join live sessions from the course page when they&apos;re active.
      </div>
    </div>
  );
};