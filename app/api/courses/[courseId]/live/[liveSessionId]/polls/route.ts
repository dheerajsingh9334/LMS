import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Verify user is the course owner
    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: user.id,
      }
    });

    if (!course) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { question, options } = await req.json();

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return new NextResponse("Invalid poll data", { status: 400 });
    }

    // Create poll in database (you may need to create this model)
    const poll = await db.livePoll.create({
      data: {
        liveSessionId: params.liveSessionId,
        question,
        options: JSON.stringify(options),
        isActive: true,
        createdBy: user.id,
      }
    });

    return NextResponse.json({ 
      id: poll.id,
      message: "Poll created successfully" 
    });

  } catch (error) {
    console.error("Error creating poll:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; liveSessionId: string } }
) {
  try {
    const user = await currentUser();
    
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get all polls for this live session
    const polls = await db.livePoll.findMany({
      where: {
        liveSessionId: params.liveSessionId,
      },
      include: {
        votes: {
          select: {
            option: true,
            userId: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Format polls with vote counts
    const formattedPolls = polls.map(poll => {
      const options = JSON.parse(poll.options);
      const votes = poll.votes || [];
      
      const optionsWithVotes = options.map((option: string, index: number) => ({
        id: `opt-${index}`,
        text: option,
        votes: votes.filter(vote => vote.option === index).length
      }));

      return {
        id: poll.id,
        question: poll.question,
        options: optionsWithVotes,
        totalVotes: votes.length,
        isActive: poll.isActive,
        createdAt: poll.createdAt
      };
    });

    return NextResponse.json({ polls: formattedPolls });

  } catch (error) {
    console.error("Error fetching polls:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}