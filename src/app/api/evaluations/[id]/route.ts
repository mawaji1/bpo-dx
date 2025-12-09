import { NextRequest, NextResponse } from 'next/server';
import { updateEvaluation, getEvaluations } from '@/lib/server-data';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/evaluations/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const evaluations = getEvaluations();
        const evaluation = evaluations.find(e => e.id === id);

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        return NextResponse.json(evaluation);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch evaluation' }, { status: 500 });
    }
}

// PUT /api/evaluations/[id] - update evaluation (committee scores, stage, notes)
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await request.json();

        const updated = updateEvaluation(id, body);
        if (!updated) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 });
    }
}
