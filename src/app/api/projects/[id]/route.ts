import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProjects, getEvaluations, saveEvaluations } from '@/lib/server-data';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const projects = getProjects();
        const project = projects.find(p => p.id === id);

        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        const projects = getProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        // Check for duplicate name (excluding current project)
        if (body.name && projects.some(p => p.name === body.name && p.id !== id)) {
            return NextResponse.json(
                { error: 'مشروع بهذا الاسم موجود مسبقاً' },
                { status: 400 }
            );
        }

        projects[projectIndex] = {
            ...projects[projectIndex],
            ...body,
            id // Ensure ID doesn't change
        };

        saveProjects(projects);

        return NextResponse.json(projects[projectIndex]);
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const projects = getProjects();
        const projectIndex = projects.findIndex(p => p.id === id);

        if (projectIndex === -1) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        // Also delete associated evaluations
        const evaluations = getEvaluations();
        const filteredEvaluations = evaluations.filter(e => e.projectId !== id);
        saveEvaluations(filteredEvaluations);

        // Remove the project
        projects.splice(projectIndex, 1);
        saveProjects(projects);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}
