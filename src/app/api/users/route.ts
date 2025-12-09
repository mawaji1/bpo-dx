import { NextRequest, NextResponse } from 'next/server';
import { getUsers, createUser, getUserByEmail } from '@/lib/db';

// GET /api/users - list all users
export async function GET() {
    try {
        const users = await getUsers();
        // Don't expose passwords
        const safeUsers = users.map(({ password, ...user }: any) => user);
        return NextResponse.json(safeUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/users - create new user
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, password, role, department, mustChangePassword } = body;

        if (!email || !name || !password || !role) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return NextResponse.json(
                { error: 'Email already exists' },
                { status: 400 }
            );
        }

        const newUser = await createUser({
            email,
            name,
            password,
            role,
            department: department || null,
            mustChangePassword: mustChangePassword ?? true,
        });

        // Don't return password
        const { password: _, ...safeUser } = newUser;
        return NextResponse.json(safeUser, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
