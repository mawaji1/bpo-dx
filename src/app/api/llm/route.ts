import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/openai';
import { getProjectById, getDepartmentById, getEvaluationByProjectId, updateEvaluation } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const project = await getProjectById(projectId);
        const evaluation = await getEvaluationByProjectId(projectId);

        if (!project || !evaluation) {
            return NextResponse.json({ error: 'Project or evaluation not found' }, { status: 404 });
        }

        // Generate roadmap using OpenAI
        const roadmap = await generateRoadmap(
            {
                name: project.name,
                department: project.department || '',
                programManager: project.programManager
            },
            evaluation.selfAssessment,
            evaluation.committeeAssessment || undefined
        );

        // Save roadmap to evaluation (we'd need to add this field to the schema)
        // For now, just return the roadmap
        return NextResponse.json({ roadmap });
    } catch (error) {
        console.error('Error generating roadmap:', error);
        return NextResponse.json(
            { error: 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}
