import { NextRequest, NextResponse } from 'next/server';
import { updateUser, deleteUser, getUserById } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/users/[id] - get single user
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const user = await getUserById(id);

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password, ...safeUser } = user;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PUT /api/users/[id] - update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await updateUser(id, body);
        if (!updated) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { password, ...safeUser } = updated;
        return NextResponse.json(safeUser);
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - delete user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await deleteUser(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
