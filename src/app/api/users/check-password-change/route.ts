import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/server-data';

// GET /api/users/check-password-change?userId=xxx
export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ mustChangePassword: false });
    }

    const users = getUsers();
    const user = users.find(u => u.id === userId);

    return NextResponse.json({
        mustChangePassword: user?.mustChangePassword || false
    });
}
