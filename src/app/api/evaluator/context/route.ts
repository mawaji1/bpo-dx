import { NextRequest, NextResponse } from 'next/server';
import { getEvaluations, getProjects, getDepartments } from '@/lib/db';

// GET /api/evaluator/context - Get evaluator's assigned projects and related data
export async function GET(request: NextRequest) {
    try {
        // Get user ID from query or session
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const evaluations = await getEvaluations();
        const projects = await getProjects();
        const departments = await getDepartments();

        // Find evaluations assigned to this evaluator
        const assignedEvaluations = evaluations.filter((e: any) =>
            e.assignedEvaluators?.includes(userId)
        );

        // Get the project IDs
        const assignedProjectIds = assignedEvaluations.map((e: any) => e.projectId);

        // Get the projects
        const assignedProjects = projects.filter((p: any) =>
            assignedProjectIds.includes(p.id)
        );

        // Get relevant department IDs
        const relevantDepartmentIds = [...new Set(assignedProjects.map((p: any) => p.departmentId))];

        // Get relevant departments
        const relevantDepartments = departments.filter((d: any) =>
            relevantDepartmentIds.includes(d.id)
        );

        return NextResponse.json({
            evaluations: assignedEvaluations,
            projects: assignedProjects,
            projectIds: assignedProjectIds,
            departments: relevantDepartments,
            departmentIds: relevantDepartmentIds
        });
    } catch (error) {
        console.error('Error getting evaluator context:', error);
        return NextResponse.json({ error: 'Failed to get evaluator context' }, { status: 500 });
    }
}
