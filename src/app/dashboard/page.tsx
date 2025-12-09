'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
    FolderKanban,
    Building2,
    CheckCircle2,
    Clock,
    BarChart3,
    Loader2
} from 'lucide-react';

interface Evaluation {
    id: string;
    projectId: string;
    selfAssessment: Assessment;
    committeeAssessment: Assessment | null;
    finalAssessment: Assessment | null;
    stage: string;
}

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

const pillarNames: Record<string, string> = {
    strategic: 'الاستراتيجي',
    operations: 'العمليات',
    technology: 'التقنيات',
    data: 'البيانات',
    customerExperience: 'تجربة العملاء'
};

const getLevelColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600 bg-green-100';
    if (score >= 3.5) return 'text-blue-600 bg-blue-100';
    if (score >= 2.5) return 'text-yellow-600 bg-yellow-100';
    if (score >= 1.5) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
};

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalProjects: 0,
        evaluatedProjects: 0,
        pendingProjects: 0,
        pipelineStats: [] as { id: string; name: string; color: string; count: number }[],
        overallAvg: { strategic: 0, operations: 0, technology: 0, data: 0, customerExperience: 0 },
        departmentStats: [] as DepartmentStat[]
    });

    useEffect(() => {
        if (status === 'loading') return;
        fetchData();
    }, [status, session]);

    async function fetchData() {
        try {
            const isEvaluator = session?.user?.role === 'evaluator';
            const userId = session?.user?.id;

            // Fetch base data
            const [projectsRes, evalsRes, configRes, deptStatsRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/evaluations'),
                fetch('/api/config'),
                fetch('/api/departments/stats')
            ]);

            let projects = await projectsRes.json();
            let evaluations: Evaluation[] = await evalsRes.json();
            const config = await configRes.json();
            let departmentStats = deptStatsRes.ok ? await deptStatsRes.json() : [];

            // Filter for evaluator
            if (isEvaluator && userId) {
                const assignedEvaluations = evaluations.filter(e =>
                    (e as any).assignedEvaluators?.includes(userId)
                );
                const assignedProjectIds = assignedEvaluations.map(e => e.projectId);

                projects = projects.filter((p: any) => assignedProjectIds.includes(p.id));
                evaluations = assignedEvaluations;

                // Filter department stats to only include relevant departments
                const relevantDeptIds = [...new Set(projects.map((p: any) => p.departmentId))];
                departmentStats = departmentStats.filter((d: DepartmentStat) =>
                    relevantDeptIds.includes(d.id)
                );
            }

            // Calculate stats
            const totalProjects = projects.length;
            const validEvaluations = evaluations.filter(e => {
                const activeScore = e.finalAssessment || e.committeeAssessment ||
                    (Object.values(e.selfAssessment || {}).some(v => v > 0) ? e.selfAssessment : null);
                return activeScore !== null && e.stage !== 'pending';
            });
            const evaluatedProjects = validEvaluations.length;
            const pendingProjects = totalProjects - evaluatedProjects;

            // Pipeline stats
            const pipelineStats = (config.stages || []).map((stage: any) => {
                let count = 0;
                if (stage.id === 'pending') {
                    const pendingEvals = evaluations.filter(e => e.stage === 'pending').length;
                    count = (totalProjects - evaluations.length) + pendingEvals;
                } else {
                    count = evaluations.filter(e => e.stage === stage.id).length;
                }
                return { id: stage.id, name: stage.name, color: stage.color, count };
            });

            // Overall averages
            const overallAvg = { strategic: 0, operations: 0, technology: 0, data: 0, customerExperience: 0 };
            if (validEvaluations.length > 0) {
                validEvaluations.forEach(e => {
                    const score = e.finalAssessment || e.committeeAssessment || e.selfAssessment;
                    if (score) {
                        overallAvg.strategic += score.strategic;
                        overallAvg.operations += score.operations;
                        overallAvg.technology += score.technology;
                        overallAvg.data += score.data;
                        overallAvg.customerExperience += score.customerExperience;
                    }
                });
                Object.keys(overallAvg).forEach(key => {
                    overallAvg[key as keyof typeof overallAvg] =
                        Math.round((overallAvg[key as keyof typeof overallAvg] / validEvaluations.length) * 10) / 10;
                });
            }

            setStats({
                totalProjects,
                evaluatedProjects,
                pendingProjects,
                pipelineStats,
                overallAvg,
                departmentStats
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    }

    const getOverallScore = (scores: Assessment) => {
        const values = Object.values(scores).filter(v => v > 0);
        if (values.length === 0) return 0;
        return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
    };

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

    const isEvaluator = session?.user?.role === 'evaluator';

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="mr-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">لوحة التحكم</h1>
                    <p className="text-slate-600 mt-1">
                        {isEvaluator ? 'نظرة عامة على مشاريعك المخصصة' : 'نظرة عامة على نضج التحول الرقمي'}
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{stats.totalProjects}</div>
                                <div className="text-slate-600 mt-1">{isEvaluator ? 'مشاريعي' : 'إجمالي المشاريع'}</div>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FolderKanban className="text-blue-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{stats.evaluatedProjects}</div>
                                <div className="text-slate-600 mt-1">تم التقييم الذاتي</div>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle2 className="text-green-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{stats.pendingProjects}</div>
                                <div className="text-slate-600 mt-1">لم تُرسل التقييم</div>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                                <Clock className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-3xl font-bold text-slate-900">{stats.departmentStats.length}</div>
                                <div className="text-slate-600 mt-1">إدارات</div>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Building2 className="text-purple-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Pipeline */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">مراحل التقييم</h2>
                            <Link href="/pipeline" className="text-sm text-blue-600 hover:underline">عرض الكل</Link>
                        </div>
                        <div className="space-y-3">
                            {stats.pipelineStats.map((stage) => (
                                <div key={stage.id} className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                                    <div className="flex-1 text-sm text-slate-600">{stage.name}</div>
                                    <div className="font-medium text-slate-900">{stage.count}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Overall Scores */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart3 className="text-blue-600" size={20} />
                            <h2 className="text-lg font-semibold text-slate-900">متوسط الأداء حسب المحور</h2>
                        </div>
                        <div className="space-y-4">
                            {Object.entries(stats.overallAvg).map(([key, value]) => (
                                <div key={key} className="flex items-center gap-4">
                                    <div className="w-24 text-sm text-slate-600">{pillarNames[key]}</div>
                                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all"
                                            style={{ width: `${(value / 5) * 100}%` }}
                                        />
                                    </div>
                                    <div className={`px-2 py-1 rounded text-sm font-medium ${getLevelColor(value)}`}>
                                        {value.toFixed(1)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Departments Table */}
                {stats.departmentStats.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">أداء الإدارات</h2>
                            <Link href="/departments" className="text-sm text-blue-600 hover:underline">تفاصيل الإدارات</Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">الإدارة</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">المشاريع</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">المُقيّمة</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">المتوسط العام</th>
                                        {Object.keys(pillarNames).map(key => (
                                            <th key={key} className="text-center py-3 px-4 text-sm font-medium text-slate-600">
                                                {pillarNames[key]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {stats.departmentStats.map((dept) => (
                                        <tr key={dept.id} className="border-b border-slate-100">
                                            <td className="py-3 px-4 font-medium text-slate-900">{dept.name}</td>
                                            <td className="py-3 px-4 text-center text-slate-600">{dept.projectCount}</td>
                                            <td className="py-3 px-4 text-center text-slate-600">{dept.evaluatedCount}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 rounded text-sm font-medium ${getLevelColor(getOverallScore(dept.avgScores))}`}>
                                                    {getOverallScore(dept.avgScores).toFixed(1)}
                                                </span>
                                            </td>
                                            {Object.keys(pillarNames).map(key => (
                                                <td key={key} className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-sm ${getLevelColor(dept.avgScores[key as keyof Assessment])}`}>
                                                        {dept.avgScores[key as keyof Assessment]?.toFixed(1) || '-'}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
