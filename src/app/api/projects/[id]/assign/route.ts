import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getEvaluationByProjectId, updateEvaluation, getUsers } from '@/lib/db';
import { prisma } from '@/lib/prisma';

// POST /api/projects/[id]/assign - Assign evaluators to a project (creates evaluation if needed)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { evaluatorIds } = body;

        if (!evaluatorIds || !Array.isArray(evaluatorIds)) {
            return NextResponse.json({ error: 'evaluatorIds array required' }, { status: 400 });
        }

        const project = await getProjectById(id);
        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        const users = await getUsers();

        // Validate evaluator IDs
        const validEvaluatorIds = evaluatorIds.filter((eId: string) =>
            users.some((u: any) => u.id === eId && u.role === 'evaluator')
        );

        // Find existing evaluation or create new one
        let evaluation = await getEvaluationByProjectId(id);

        if (!evaluation) {
            // Create new evaluation for this project
            evaluation = await prisma.evaluation.create({
                data: {
                    projectId: id,
                    stage: 'pending',
                    assignedEvaluators: validEvaluatorIds,
                },
            }) as any;
        } else {
            // Update existing evaluation
            evaluation = await updateEvaluation(evaluation.id, {
                assignedEvaluators: validEvaluatorIds,
            });
        }

        return NextResponse.json(evaluation);
    } catch (error) {
        console.error('Error assigning evaluators:', error);
        return NextResponse.json({ error: 'Failed to assign evaluators' }, { status: 500 });
    }
}
