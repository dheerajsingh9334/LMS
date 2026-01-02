import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, rollNo } = body;

        if (!userId || !rollNo) {
            return new NextResponse('Missing userId or rollNo', { status: 400 });
        }

        // Roll number functionality disabled - User model doesn't have rollNo field
        return new NextResponse('Roll number functionality not available', { status: 400 });
    } catch (error) {
        console.error("Error updating roll number:", error);
        return new NextResponse('Internal server error', { status: 500 });
    }
}
