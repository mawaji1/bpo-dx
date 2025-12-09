import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getEvaluations, getProjects, getDepartments } from '@/lib/server-data';

// GET /api/evaluator/context - Get evaluator's assigned projects and related data
export async function GET(request: NextRequest) {
    try {
        // Get user ID from query or session
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        }

        const evaluations = getEvaluations();
        const projects = getProjects();
        const departments = getDepartments();

        // Find evaluations assigned to this evaluator
        const assignedEvaluations = evaluations.filter(e =>
            e.assignedEvaluators?.includes(userId)
        );

        // Get the project IDs
        const assignedProjectIds = assignedEvaluations.map(e => e.projectId);

        // Get the projects
        const assignedProjects = projects.filter(p =>
            assignedProjectIds.includes(p.id)
        );

        // Get relevant department IDs
        const relevantDepartmentIds = [...new Set(assignedProjects.map(p => p.departmentId))];

        // Get relevant departments
        const relevantDepartments = departments.filter(d =>
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
