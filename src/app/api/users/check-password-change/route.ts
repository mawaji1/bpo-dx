import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/lib/db';

// GET /api/users/check-password-change?userId=xxx
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ mustChangePassword: false });
    }

    const user = await getUserById(userId);

    return NextResponse.json({
        mustChangePassword: user?.mustChangePassword || false
    });
}
