import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, getProjects, updateProject, deleteProject } from '@/lib/db';

interface Params {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const project = await getProjectById(id);

        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        return NextResponse.json(project);
    } catch (error) {
        console.error('Error fetching project:', error);
        return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const body = await request.json();

        const existingProject = await getProjectById(id);
        if (!existingProject) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        // Check for duplicate name (excluding current project)
        if (body.name) {
            const projects = await getProjects();
            if (projects.some((p: any) => p.name === body.name && p.id !== id)) {
                return NextResponse.json(
                    { error: 'مشروع بهذا الاسم موجود مسبقاً' },
                    { status: 400 }
                );
            }
        }

        const updated = await updateProject(id, body);
        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating project:', error);
        return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;

        const project = await getProjectById(id);
        if (!project) {
            return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
        }

        // Evaluation will be cascade deleted by Prisma
        await deleteProject(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting project:', error);
        return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
    }
}
