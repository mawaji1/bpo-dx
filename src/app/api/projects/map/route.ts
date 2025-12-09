import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject, getEvaluationByProjectId, updateEvaluation, updateProject } from '@/lib/db';
import { prisma } from '@/lib/prisma';

// POST /api/projects/map - map a submission to a project or create new project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { submissionId, projectId, createNew, newProjectData, submissionScores } = body;

        if (!submissionId) {
            return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
        }

        let targetProject: any;

        if (createNew && newProjectData) {
            // Create new project (also creates evaluation)
            targetProject = await createProject({
                name: newProjectData.name,
                departmentId: newProjectData.departmentId || 'dept_01',
                programManager: newProjectData.programManager || '',
                city: newProjectData.city || 'الرياض',
                submissionId: submissionId
            });

            // Update evaluation with self assessment if scores provided
            if (submissionScores) {
                const evaluation = await getEvaluationByProjectId(targetProject.id);
                if (evaluation) {
                    await updateEvaluation(evaluation.id, {
                        selfAssessment: submissionScores,
                        stage: 'self_submitted'
                    });
                }
            }
        } else if (projectId) {
            // Map to existing project
            targetProject = await updateProject(projectId, { submissionId });
            if (!targetProject) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }

            // Update evaluation with self assessment if scores provided
            if (submissionScores) {
                const evaluation = await getEvaluationByProjectId(projectId);
                if (evaluation) {
                    await updateEvaluation(evaluation.id, {
                        selfAssessment: submissionScores,
                        stage: 'self_submitted'
                    });
                }
            }
        } else {
            return NextResponse.json({ error: 'Either projectId or createNew required' }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            project: targetProject
        });
    } catch (error) {
        console.error('Error mapping submission:', error);
        return NextResponse.json({ error: 'Failed to map submission' }, { status: 500 });
    }
}
