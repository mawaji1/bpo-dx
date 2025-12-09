import { NextRequest, NextResponse } from 'next/server';
import { getEvaluations, saveEvaluations, getUsers } from '@/lib/server-data';

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

        const evaluations = getEvaluations();
        const users = getUsers();

        const evalIndex = evaluations.findIndex(e => e.id === id);
        if (evalIndex === -1) {
            return NextResponse.json({ error: 'التقييم غير موجود' }, { status: 404 });
        }

        // Validate evaluator IDs
        const validEvaluatorIds = evaluatorIds.filter(eId =>
            users.some(u => u.id === eId && u.role === 'evaluator')
        );

        evaluations[evalIndex] = {
            ...evaluations[evalIndex],
            assignedEvaluators: validEvaluatorIds,
            stage: validEvaluatorIds.length > 0 ? 'under_review' : evaluations[evalIndex].stage,
            updatedAt: new Date().toISOString()
        };

        saveEvaluations(evaluations);

        return NextResponse.json(evaluations[evalIndex]);
    } catch (error) {
        console.error('Error assigning evaluators:', error);
        return NextResponse.json({ error: 'Failed to assign evaluators' }, { status: 500 });
    }
}
