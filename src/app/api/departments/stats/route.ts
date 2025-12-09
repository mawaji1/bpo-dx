import { NextResponse } from 'next/server';
import { getDepartmentStats } from '@/lib/data';

export async function GET() {
    try {
        const stats = getDepartmentStats();
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching department stats:', error);
        return NextResponse.json({ error: 'Failed to fetch department stats' }, { status: 500 });
    }
}
