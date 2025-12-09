'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Calendar,
    User
} from 'lucide-react';

interface Evaluation {
    id: string;
    projectId: string;
    selfAssessment: {
        strategic: number;
        operations: number;
        technology: number;
        data: number;
        customerExperience: number;
    };
    committeeAssessment: any;
    stage: string;
    assignedEvaluators: string[];
    meetingDate: string | null;
}

interface Project {
    id: string;
    name: string;
    departmentId: string;
    programManager: string;
}

interface Department {
    id: string;
    name: string;
}

interface Stage {
    id: string;
    name: string;
    color: string;
}

export default function EvaluatorDashboard() {
    const { data: session, status } = useSession();
    const [loading, setLoading] = useState(true);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [stages, setStages] = useState<Stage[]>([]);

    useEffect(() => {
        if (session?.user?.id) {
            fetchData();
        }
    }, [session]);

    async function fetchData() {
        try {
            const [evalRes, projRes, deptRes, configRes] = await Promise.all([
                fetch('/api/evaluations'),
                fetch('/api/projects'),
                fetch('/api/departments'),
                fetch('/api/config')
            ]);

            if (evalRes.ok) setEvaluations(await evalRes.json());
            if (projRes.ok) setProjects(await projRes.json());
            if (deptRes.ok) setDepartments(await deptRes.json());
            if (configRes.ok) {
                const config = await configRes.json();
                setStages(config.stages || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Filter evaluations assigned to current user
    const myEvaluations = evaluations.filter(e =>
        e.assignedEvaluators?.includes(session?.user?.id || '')
    );

    const pendingEvaluations = myEvaluations.filter(e =>
        e.stage === 'self_submitted' || e.stage === 'under_review'
    );

    const completedEvaluations = myEvaluations.filter(e =>
        e.stage === 'committee_evaluated' || e.stage === 'summit_reviewed'
    );

    const getProjectData = (evaluation: Evaluation) => {
        const project = projects.find(p => p.id === evaluation.projectId);
        const department = departments.find(d => d.id === project?.departmentId);
        const stage = stages.find(s => s.id === evaluation.stage);

        const avgScore = (
            evaluation.selfAssessment.strategic +
            evaluation.selfAssessment.operations +
            evaluation.selfAssessment.technology +
            evaluation.selfAssessment.data +
            evaluation.selfAssessment.customerExperience
        ) / 5;

        return { project, department, stage, avgScore };
    };

    const getLevelColor = (score: number) => {
        if (score >= 4.5) return 'bg-green-100 text-green-700';
        if (score >= 3.5) return 'bg-blue-100 text-blue-700';
        if (score >= 2.5) return 'bg-yellow-100 text-yellow-700';
        if (score >= 1.5) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="mr-64 p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">لوحة المقيّم</h1>
                    <p className="text-slate-600 mt-1">مرحباً {session?.user?.name}، هذه المشاريع المسندة إليك</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                <ClipboardList className="text-blue-600" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{myEvaluations.length}</div>
                                <div className="text-slate-600 text-sm">إجمالي المشاريع المسندة</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Clock className="text-amber-600" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{pendingEvaluations.length}</div>
                                <div className="text-slate-600 text-sm">بانتظار التقييم</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="text-green-600" size={24} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{completedEvaluations.length}</div>
                                <div className="text-slate-600 text-sm">تم تقييمها</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Evaluations */}
                {pendingEvaluations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                        <div className="flex items-center gap-3 mb-6">
                            <AlertCircle className="text-amber-600" size={20} />
                            <h2 className="text-lg font-semibold text-slate-900">مشاريع تحتاج تقييمك</h2>
                        </div>

                        <div className="space-y-4">
                            {pendingEvaluations.map(evaluation => {
                                const { project, department, stage, avgScore } = getProjectData(evaluation);
                                return (
                                    <div
                                        key={evaluation.id}
                                        className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-amber-200">
                                                <ClipboardList className="text-amber-600" size={20} />
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{project?.name}</div>
                                                <div className="text-sm text-slate-500">
                                                    {department?.name} • {project?.programManager}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getLevelColor(avgScore)}`}>
                                                التقييم الذاتي: {avgScore.toFixed(1)}
                                            </span>
                                            <Link
                                                href={`/projects/${project?.id}`}
                                                className="btn btn-primary btn-sm"
                                            >
                                                تقييم الآن
                                                <ArrowLeft size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Assigned Projects */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h2 className="text-lg font-semibold text-slate-900 mb-6">جميع المشاريع المسندة</h2>

                    {myEvaluations.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <User className="mx-auto mb-4 text-slate-300" size={48} />
                            <p>لم يتم إسناد أي مشاريع لك بعد</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">المشروع</th>
                                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">الإدارة</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">التقييم الذاتي</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">المرحلة</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600">الاجتماع</th>
                                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-600"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myEvaluations.map(evaluation => {
                                        const { project, department, stage, avgScore } = getProjectData(evaluation);
                                        return (
                                            <tr key={evaluation.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-3 px-4 font-medium text-slate-900">{project?.name}</td>
                                                <td className="py-3 px-4 text-slate-600">{department?.name}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`px-2 py-1 rounded text-sm ${getLevelColor(avgScore)}`}>
                                                        {avgScore.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span
                                                        className="px-3 py-1 rounded-full text-xs font-medium"
                                                        style={{ backgroundColor: `${stage?.color}20`, color: stage?.color }}
                                                    >
                                                        {stage?.name}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center text-sm text-slate-500">
                                                    {evaluation.meetingDate
                                                        ? new Date(evaluation.meetingDate).toLocaleDateString('ar-SA')
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Link
                                                        href={`/projects/${project?.id}`}
                                                        className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 text-sm"
                                                    >
                                                        التفاصيل
                                                        <ArrowLeft size={14} />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
