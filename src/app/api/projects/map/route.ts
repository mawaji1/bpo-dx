import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProjects, getEvaluations, saveEvaluations } from '@/lib/server-data';
import type { Project, Evaluation } from '@/lib/server-data';

// POST /api/projects/map - map a submission to a project or create new project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { submissionId, projectId, createNew, newProjectData, submissionScores } = body;

        if (!submissionId) {
            return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
        }

        const projects = getProjects();
        const evaluations = getEvaluations();

        let targetProject: Project;

        if (createNew && newProjectData) {
            // Create new project
            const newProject: Project = {
                id: `proj_${Date.now()}`,
                name: newProjectData.name,
                departmentId: newProjectData.departmentId || 'dept_01',
                programManager: newProjectData.programManager || '',
                city: newProjectData.city || 'الرياض',
                submissionId: submissionId
            };
            projects.push(newProject);
            saveProjects(projects);
            targetProject = newProject;
        } else if (projectId) {
            // Map to existing project
            const projectIndex = projects.findIndex(p => p.id === projectId);
            if (projectIndex === -1) {
                return NextResponse.json({ error: 'Project not found' }, { status: 404 });
            }
            projects[projectIndex].submissionId = submissionId;
            saveProjects(projects);
            targetProject = projects[projectIndex];
        } else {
            return NextResponse.json({ error: 'Either projectId or createNew required' }, { status: 400 });
        }

        // Create evaluation for this project if scores provided
        if (submissionScores) {
            const existingEval = evaluations.find(e => e.projectId === targetProject.id);
            if (!existingEval) {
                const newEvaluation: Evaluation = {
                    id: `eval_${Date.now()}`,
                    projectId: targetProject.id,
                    submissionId: submissionId,
                    selfAssessment: submissionScores,
                    committeeAssessment: null,
                    finalAssessment: null,
                    stage: 'self_submitted',
                    assignedEvaluators: [],
                    meetingDate: null,
                    meetingNotes: '',
                    llmRoadmap: null,
                    createdAt: new Date().toISOString(),
                    updatedAt: null
                };
                evaluations.push(newEvaluation);
                saveEvaluations(evaluations);
            }
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
