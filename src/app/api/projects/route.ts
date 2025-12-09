import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';

export async function GET() {
    try {
        const projects = await getProjects();
        return NextResponse.json(projects);
    } catch (error) {
        console.error('Error fetching projects:', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, departmentId, programManager, city } = body;

        if (!name || !departmentId) {
            return NextResponse.json(
                { error: 'اسم المشروع والإدارة مطلوبان' },
                { status: 400 }
            );
        }

        const projects = await getProjects();

        // Check for duplicate name
        if (projects.some((p: any) => p.name === name)) {
            return NextResponse.json(
                { error: 'مشروع بهذا الاسم موجود مسبقاً' },
                { status: 400 }
            );
        }

        const newProject = await createProject({
            name,
            departmentId,
            programManager: programManager || '',
            city: city || 'الرياض',
        });

        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
