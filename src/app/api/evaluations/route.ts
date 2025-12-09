import { NextResponse } from 'next/server';
import { getEvaluations } from '@/lib/db';

// GET /api/evaluations - list all evaluations
export async function GET() {
    try {
        const evaluations = await getEvaluations();
        return NextResponse.json(evaluations);
    } catch (error) {
        console.error('Error fetching evaluations:', error);
        return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
    }
}
