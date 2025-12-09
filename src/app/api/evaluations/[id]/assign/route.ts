import { NextRequest, NextResponse } from 'next/server';
import { getEvaluationById, updateEvaluation, getUsers } from '@/lib/db';

interface Params {
    params: Promise<{ id: string }>;
}

// POST /api/evaluations/[id]/assign - Assign evaluators to a project
export async function POST(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { evaluatorIds } = body;

        if (!evaluatorIds || !Array.isArray(evaluatorIds)) {
            return NextResponse.json({ error: 'evaluatorIds array required' }, { status: 400 });
        }

        const evaluation = await getEvaluationById(id);
        if (!evaluation) {
            return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
        }

        const users = await getUsers();

        // Validate evaluator IDs
        const validEvaluatorIds = evaluatorIds.filter((eId: string) =>
            users.some((u: any) => u.id === eId && u.role === 'evaluator')
        );

        const updated = await updateEvaluation(id, {
            assignedEvaluators: validEvaluatorIds,
            stage: validEvaluatorIds.length > 0 ? 'under_review' : evaluation.stage,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error assigning evaluators:', error);
        return NextResponse.json({ error: 'Failed to assign evaluators' }, { status: 500 });
    }
}
