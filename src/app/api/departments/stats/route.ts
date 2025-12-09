import { NextResponse } from 'next/server';
import { getDepartments, getProjects, getEvaluations } from '@/lib/db';

export async function GET() {
    try {
        const departments = await getDepartments();
        const projects = await getProjects();
        const evaluations = await getEvaluations();

        // Helper to get active score
        const getActiveScore = (evaluation: any) => {
            if (evaluation.finalAssessment) return evaluation.finalAssessment;
            if (evaluation.committeeAssessment) return evaluation.committeeAssessment;
            if (evaluation.selfAssessment) {
                const hasScores = Object.values(evaluation.selfAssessment).some((v: any) => v > 0);
                if (hasScores) return evaluation.selfAssessment;
            }
            return null;
        };

        const stats = departments.map((dept: any) => {
            const deptProjects = projects.filter((p: any) => p.departmentId === dept.id);
            const deptEvaluations = evaluations.filter((e: any) =>
                deptProjects.some((p: any) => p.id === e.projectId)
            );

            // Only count evaluations with valid scores
            const validEvaluations = deptEvaluations.filter((e: any) => getActiveScore(e) !== null);

            const avgScores = {
                strategic: 0,
                operations: 0,
                technology: 0,
                data: 0,
                customerExperience: 0
            };

            if (validEvaluations.length > 0) {
                validEvaluations.forEach((ev: any) => {
                    const activeScore = getActiveScore(ev);
                    if (activeScore) {
                        avgScores.strategic += activeScore.strategic;
                        avgScores.operations += activeScore.operations;
                        avgScores.technology += activeScore.technology;
                        avgScores.data += activeScore.data;
                        avgScores.customerExperience += activeScore.customerExperience;
                    }
                });

                Object.keys(avgScores).forEach(key => {
                    avgScores[key as keyof typeof avgScores] =
                        Math.round((avgScores[key as keyof typeof avgScores] / validEvaluations.length) * 10) / 10;
                });
            }

            return {
                id: dept.id,
                name: dept.name,
                projectCount: deptProjects.length,
                evaluatedCount: validEvaluations.length,
                avgScores
            };
        });

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching department stats:', error);
        return NextResponse.json({ error: 'Failed to fetch department stats' }, { status: 500 });
    }
}
