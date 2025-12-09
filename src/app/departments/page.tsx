'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import DepartmentCard from '@/components/DepartmentCard';
import { Loader2 } from 'lucide-react';

interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

interface DepartmentStat {
    id: string;
    name: string;
    projectCount: number;
    evaluatedCount: number;
    avgScores: Assessment;
}

interface Pillar {
    id: string;
    name: string;
}

export default function DepartmentsPage() {
    const { data: session, status } = useSession();
    const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
    const [pillars, setPillars] = useState<Pillar[]>([]);
    const [loading, setLoading] = useState(true);

    const isEvaluator = session?.user?.role === 'evaluator';
    const userId = session?.user?.id;

    useEffect(() => {
        if (status !== 'loading') fetchData();
    }, [status]);

    async function fetchData() {
        try {
            const [deptStatsRes, projRes, evalRes, configRes] = await Promise.all([
                fetch('/api/departments/stats'),
                fetch('/api/projects'),
                fetch('/api/evaluations'),
                fetch('/api/config')
            ]);

            let deptStats: DepartmentStat[] = deptStatsRes.ok ? await deptStatsRes.json() : [];
            const projects = projRes.ok ? await projRes.json() : [];
            let evaluations = evalRes.ok ? await evalRes.json() : [];
            const config = configRes.ok ? await configRes.json() : { pillars: [] };

            // Filter for evaluator - show only departments with assigned projects
            if (isEvaluator && userId) {
                const assignedEvals = evaluations.filter((e: any) =>
                    e.assignedEvaluators?.includes(userId)
                );
                const assignedProjectIds = assignedEvals.map((e: any) => e.projectId);
                const assignedProjects = projects.filter((p: any) =>
                    assignedProjectIds.includes(p.id)
                );
                const relevantDeptIds = [...new Set(assignedProjects.map((p: any) => p.departmentId))];

                // Filter and recalculate stats for relevant departments
                deptStats = (relevantDeptIds as string[]).map(deptId => {
                    const originalDept = deptStats.find(d => d.id === deptId);
                    const deptProjects = assignedProjects.filter((p: any) => p.departmentId === deptId);
                    const deptEvals = assignedEvals.filter((e: any) =>
                        deptProjects.some((p: any) => p.id === e.projectId)
                    );

                    // Only count evaluations with actual scores (not pending/zero)
                    const validEvals = deptEvals.filter((ev: any) => {
                        const score = ev.finalAssessment || ev.committeeAssessment || ev.selfAssessment;
                        if (!score) return false;
                        // Check if score has any non-zero values
                        return Object.values(score).some((v: any) => v > 0);
                    });

                    // Recalculate averages for valid evaluations only
                    const avgScores = { strategic: 0, operations: 0, technology: 0, data: 0, customerExperience: 0 };
                    if (validEvals.length > 0) {
                        validEvals.forEach((ev: any) => {
                            const score = ev.finalAssessment || ev.committeeAssessment || ev.selfAssessment;
                            avgScores.strategic += score.strategic || 0;
                            avgScores.operations += score.operations || 0;
                            avgScores.technology += score.technology || 0;
                            avgScores.data += score.data || 0;
                            avgScores.customerExperience += score.customerExperience || 0;
                        });
                        Object.keys(avgScores).forEach(key => {
                            avgScores[key as keyof typeof avgScores] /= validEvals.length;
                        });
                    }

                    return {
                        id: deptId,
                        name: originalDept?.name || 'Unknown',
                        projectCount: deptProjects.length,
                        evaluatedCount: validEvals.length,
                        avgScores
                    };
                });
            }

            setDepartmentStats(deptStats);
            setPillars(config.pillars.map((p: any) => ({ id: p.id, name: p.name })));
        } catch (error) {
            console.error('Error fetching department data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Calculate sector average
    const evaluatedDepts = departmentStats.filter(d => d.evaluatedCount > 0);
    const sectorAvg = { strategic: 0, operations: 0, technology: 0, data: 0, customerExperience: 0 };

    if (evaluatedDepts.length > 0) {
        evaluatedDepts.forEach(d => {
            sectorAvg.strategic += d.avgScores.strategic;
            sectorAvg.operations += d.avgScores.operations;
            sectorAvg.technology += d.avgScores.technology;
            sectorAvg.data += d.avgScores.data;
            sectorAvg.customerExperience += d.avgScores.customerExperience;
        });
        Object.keys(sectorAvg).forEach(key => {
            sectorAvg[key as keyof typeof sectorAvg] /= evaluatedDepts.length;
        });
    }

    const totalAvg = (sectorAvg.strategic + sectorAvg.operations + sectorAvg.technology + sectorAvg.data + sectorAvg.customerExperience) / 5;

    if (loading) {
        return (
            <div className="min-h-screen">
                <Sidebar />
                <main className="mr-64 p-8 flex items-center justify-center min-h-screen">
                    <Loader2 className="animate-spin text-blue-600" size={40} />
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="mr-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">الإدارات</h1>
                    <p className="text-slate-600 mt-1">
                        {isEvaluator ? 'مقارنة أداء الإدارات لمشاريعك المخصصة' : 'مقارنة أداء الإدارات عبر محاور النضج الرقمي'}
                    </p>
                </div>

                {/* Sector Overview */}
                <div className="bg-gradient-to-l from-blue-600 to-blue-700 rounded-xl p-6 mb-8 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-medium opacity-90">
                                {isEvaluator ? 'متوسط مشاريعي' : 'متوسط القطاع'}
                            </h2>
                            <div className="text-4xl font-bold mt-2">{totalAvg.toFixed(1)}</div>
                            <div className="text-sm opacity-75 mt-1">من 5.0</div>
                        </div>
                        <div className="grid grid-cols-5 gap-4">
                            {pillars.map((pillar) => (
                                <div key={pillar.id} className="text-center">
                                    <div className="text-2xl font-bold">
                                        {sectorAvg[pillar.id as keyof typeof sectorAvg]?.toFixed(1) || '0.0'}
                                    </div>
                                    <div className="text-xs opacity-75 mt-1">{pillar.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Departments */}
                <div className="space-y-4">
                    {departmentStats.length > 0 ? (
                        departmentStats.map((dept) => (
                            <DepartmentCard key={dept.id} dept={dept} pillars={pillars} />
                        ))
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            لا توجد إدارات لعرضها
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
