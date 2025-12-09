import { NextRequest, NextResponse } from 'next/server';
import { getEvaluations } from '@/lib/server-data';

// GET /api/evaluations - list all evaluations
export async function GET() {
    try {
        const evaluations = getEvaluations();
        return NextResponse.json(evaluations);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch evaluations' }, { status: 500 });
    }
}
