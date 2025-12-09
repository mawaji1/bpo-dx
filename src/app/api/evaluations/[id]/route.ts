import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation, getEvaluationById } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/evaluations/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const evaluation = await getEvaluationById(id);

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        return NextResponse.json(evaluation);
    } catch (error) {
        console.error('Error fetching evaluation:', error);
        return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
    }
}

// PUT /api/evaluations/[id] - update evaluation (committee scores, stage, notes)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = await updateEvaluation(id, body);
        if (!updated) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating evaluation:', error);
        return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 });
    }
}
