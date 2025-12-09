import { NextRequest, NextResponse } from 'next/server';
import { getProjects, getEvaluations, saveEvaluations, getUsers } from '@/lib/server-data';

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

        const projects = getProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        const evaluations = getEvaluations();
        const users = getUsers();

        // Validate evaluator IDs
        const validEvaluatorIds = evaluatorIds.filter(eId =>
            users.some(u => u.id === eId && u.role === 'evaluator')
        );

        // Find existing evaluation or create new one
        let evalIndex = evaluations.findIndex(e => e.projectId === id);

        if (evalIndex === -1) {
            // Create new evaluation for this project (pending self-assessment)
            const newEval = {
                id: `eval_${Date.now()}`,
                projectId: id,
                submissionId: project.submissionId || '',
                selfAssessment: {
                    strategic: 0,
                    operations: 0,
                    technology: 0,
                    data: 0,
                    customerExperience: 0
                },
                committeeAssessment: null,
                finalAssessment: null,
                stage: 'pending',
                assignedEvaluators: validEvaluatorIds,
                meetingDate: null,
                meetingNotes: '',
                llmRoadmap: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            evaluations.push(newEval);
            evalIndex = evaluations.length - 1;
        } else {
            // Update existing evaluation
            evaluations[evalIndex] = {
                ...evaluations[evalIndex],
                assignedEvaluators: validEvaluatorIds,
                updatedAt: new Date().toISOString()
            };
        }

        saveEvaluations(evaluations);

        return NextResponse.json(evaluations[evalIndex]);
    } catch (error) {
        console.error('Error assigning evaluators:', error);
        return NextResponse.json({ error: 'Failed to assign evaluators' }, { status: 500 });
    }
}
