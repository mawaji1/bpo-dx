import { NextRequest, NextResponse } from 'next/server';
import { getProjects, saveProjects } from '@/lib/server-data';

export async function GET() {
    try {
        const projects = getProjects();
        return NextResponse.json(projects);
    } catch (error) {
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

        const projects = getProjects();

        // Check for duplicate name
        if (projects.some(p => p.name === name)) {
            return NextResponse.json(
                { error: 'مشروع بهذا الاسم موجود مسبقاً' },
                { status: 400 }
            );
        }

        const newProject = {
            id: `proj_${Date.now()}`,
            name,
            departmentId,
            programManager: programManager || '',
            city: city || 'الرياض',
            submissionId: null
        };

        projects.push(newProject);
        saveProjects(projects);

        return NextResponse.json(newProject, { status: 201 });
    } catch (error) {
        console.error('Error creating project:', error);
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}
