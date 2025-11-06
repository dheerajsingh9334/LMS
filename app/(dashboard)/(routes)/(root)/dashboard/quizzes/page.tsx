import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { FileQuestion, Trophy, Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const MyQuizzesPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/");
  }

  // Get all courses the user has purchased
  const purchases = await db.purchase.findMany({
    where: {
      userId: userId,
    },
    select: {
      courseId: true,
    }
  });

  const courseIds = purchases.map(p => p.courseId);

  // Get all quizzes from purchased courses with user attempts
  const chapters = await db.chapter.findMany({
    where: {
      courseId: {
        in: courseIds
      },
      isPublished: true,
    },
    include: {
      course: {
        select: {
          title: true,
        }
      },
      quizzes: {
        where: {
          isPublished: true,
        },
        include: {
          quizAttempts: {
            where: {
              userId: userId,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          },
          questions: {
            select: {
              id: true,
            }
          }
        }
      }
    }
  });


  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Quizzes</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Track all your quizzes across courses
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileQuestion className="h-16 w-16 text-slate-300 dark:text-slate-700 mb-4" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400 mb-2">
            Quiz Tracking Coming Soon
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 text-center max-w-md">
            Quiz tracking across all courses will be available soon. 
            For now, you can take quizzes within each course chapter.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyQuizzesPage;
