import { NextRequest, NextResponse } from 'next/server';
import { getEvaluations, saveEvaluations, getUsers } from '@/lib/server-data';
import { getServerSession } from 'next-auth';

interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

interface EvaluatorAssessment {
    evaluatorId: string;
    evaluatorName: string;
    assessment: Assessment;
    comments: Record<string, string>;
    submittedAt: string;
}

// POST /api/evaluations/[id]/score - Submit evaluator's individual score
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { evaluatorId, assessment, comments } = body;

        if (!evaluatorId || !assessment) {
            return NextResponse.json({ error: 'evaluatorId and assessment required' }, { status: 400 });
        }

        const evaluations = getEvaluations();
        const users = getUsers();
        const evalIndex = evaluations.findIndex(e => e.id === id);

        if (evalIndex === -1) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        const evaluator = users.find(u => u.id === evaluatorId);
        if (!evaluator) {
            return NextResponse.json({ error: 'Evaluator not found' }, { status: 404 });
        }

        // Initialize evaluatorAssessments if not exists
        if (!evaluations[evalIndex].evaluatorAssessments) {
            evaluations[evalIndex].evaluatorAssessments = [];
        }

        // Find existing assessment from this evaluator or add new
        const existingIdx = evaluations[evalIndex].evaluatorAssessments.findIndex(
            (ea: EvaluatorAssessment) => ea.evaluatorId === evaluatorId
        );

        const newAssessment: EvaluatorAssessment = {
            evaluatorId,
            evaluatorName: evaluator.name,
            assessment,
            comments: comments || {},
            submittedAt: new Date().toISOString()
        };

        if (existingIdx !== -1) {
            evaluations[evalIndex].evaluatorAssessments[existingIdx] = newAssessment;
        } else {
            evaluations[evalIndex].evaluatorAssessments.push(newAssessment);
        }

        // Calculate average (committeeAssessment = average of all evaluator scores)
        const allAssessments = evaluations[evalIndex].evaluatorAssessments as EvaluatorAssessment[];
        if (allAssessments.length > 0) {
            const avgAssessment: Assessment = {
                strategic: 0,
                operations: 0,
                technology: 0,
                data: 0,
                customerExperience: 0
            };

            allAssessments.forEach((ea: EvaluatorAssessment) => {
                avgAssessment.strategic += ea.assessment.strategic;
                avgAssessment.operations += ea.assessment.operations;
                avgAssessment.technology += ea.assessment.technology;
                avgAssessment.data += ea.assessment.data;
                avgAssessment.customerExperience += ea.assessment.customerExperience;
            });

            const count = allAssessments.length;
            avgAssessment.strategic = Math.round((avgAssessment.strategic / count) * 10) / 10;
            avgAssessment.operations = Math.round((avgAssessment.operations / count) * 10) / 10;
            avgAssessment.technology = Math.round((avgAssessment.technology / count) * 10) / 10;
            avgAssessment.data = Math.round((avgAssessment.data / count) * 10) / 10;
            avgAssessment.customerExperience = Math.round((avgAssessment.customerExperience / count) * 10) / 10;

            evaluations[evalIndex].committeeAssessment = avgAssessment;
        }

        // Update stage
        evaluations[evalIndex].stage = 'under_review';
        evaluations[evalIndex].updatedAt = new Date().toISOString();

        saveEvaluations(evaluations);

        return NextResponse.json(evaluations[evalIndex]);
    } catch (error) {
        console.error('Error submitting score:', error);
        return NextResponse.json({ error: 'Failed to submit score' }, { status: 500 });
    }
}
