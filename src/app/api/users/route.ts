import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/server-data';

// GET /api/users - list all users
export async function GET() {
    try {
        const users = getUsers();
        // Don't expose passwords
        const safeUsers = users.map(({ password, ...user }) => user);
        return NextResponse.json(safeUsers);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/users - create new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, password, role, department } = body;

        if (!email || !name || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const users = getUsers();
        if (users.some(u => u.email === email)) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        const newUser = createUser({
            email,
            name,
            password,
            role,
            department: department || null,
            assignedProjects: []
        });

        // Don't return password
        const { password: _, ...safeUser } = newUser;
        return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
