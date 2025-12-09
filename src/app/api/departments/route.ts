import { NextResponse } from 'next/server';
import { getDepartments } from '@/lib/server-data';

export async function GET() {
    try {
        const departments = getDepartments();
        return NextResponse.json(departments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }
}
