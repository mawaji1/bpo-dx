import { NextRequest, NextResponse } from 'next/server';
import { generateRoadmap } from '@/lib/openai';
import { getProjects, getDepartments, getEvaluations, saveEvaluations } from '@/lib/server-data';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId } = body;

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
        }

        const projects = getProjects();
        const departments = getDepartments();
        const evaluations = getEvaluations();

        const project = projects.find(p => p.id === projectId);
        const evaluation = evaluations.find(e => e.projectId === projectId);

        if (!project || !evaluation) {
            return NextResponse.json({ error: 'Project or evaluation not found' }, { status: 404 });
        }

        const department = departments.find(d => d.id === project.departmentId);

        // Generate roadmap using OpenAI
        const roadmap = await generateRoadmap(
            {
                name: project.name,
                department: department?.name || '',
                programManager: project.programManager
            },
            evaluation.selfAssessment,
            evaluation.committeeAssessment || undefined
        );

        // Save roadmap to evaluation
        const updatedEvaluations = evaluations.map(e => {
            if (e.id === evaluation.id) {
                return {
                    ...e,
                    llmRoadmap: roadmap,
                    updatedAt: new Date().toISOString()
                };
            }
            return e;
        });

        saveEvaluations(updatedEvaluations);

        return NextResponse.json({ roadmap });
    } catch (error) {
        console.error('Error generating roadmap:', error);
        return NextResponse.json(
            { error: 'Failed to generate roadmap' },
            { status: 500 }
        );
    }
}
