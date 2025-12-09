'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';

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
    assignedEvaluators: string[];
    meetingDate: string | null;
    stage: string;
    project?: { id: string; name: string };
}

interface StageConfig {
    id: string;
    name: string;
    color: string;
}

interface PipelineStage extends StageConfig {
    count: number;
    projects: Evaluation[];
}

export default function PipelinePage() {
    const { data: session, status } = useSession();
    const [pipelineStats, setPipelineStats] = useState<PipelineStage[]>([]);
    const [stages, setStages] = useState<StageConfig[]>([]);
    const [loading, setLoading] = useState(true);

    const isEvaluator = session?.user?.role === 'evaluator';
    const userId = session?.user?.id;

    useEffect(() => {
        if (status !== 'loading') fetchData();
    }, [status]);

    async function fetchData() {
        try {
            const [evalRes, projRes, configRes] = await Promise.all([
                fetch('/api/evaluations'),
                fetch('/api/projects'),
                fetch('/api/config')
            ]);

            let evaluations = evalRes.ok ? await evalRes.json() : [];
            const projects = projRes.ok ? await projRes.json() : [];
            const config = configRes.ok ? await configRes.json() : { stages: [] };

            // Filter for evaluator
            if (isEvaluator && userId) {
                evaluations = evaluations.filter((e: any) =>
                    e.assignedEvaluators?.includes(userId)
                );
            }

            // Add project names to evaluations
            const evalsWithProjects = evaluations.map((e: Evaluation) => ({
                ...e,
                project: projects.find((p: any) => p.id === e.projectId)
            }));

            // Build pipeline stats
            const stats = config.stages.map((stage: StageConfig) => {
                const stageProjects = evalsWithProjects.filter((e: Evaluation) => e.stage === stage.id);
                return {
                    ...stage,
                    count: stageProjects.length,
                    projects: stageProjects
                };
            });

            setPipelineStats(stats);
            setStages(config.stages);
        } catch (error) {
            console.error('Error fetching pipeline data:', error);
        } finally {
            setLoading(false);
        }
    }

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
                    <h1 className="text-2xl font-bold text-slate-900">مراحل التقييم</h1>
                    <p className="text-slate-600 mt-1">
                        {isEvaluator ? 'تتبع حالة مشاريعك المخصصة' : 'تتبع حالة المشاريع عبر مراحل التقييم المختلفة'}
                    </p>
                </div>

                {/* Pipeline Kanban */}
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {pipelineStats.map((stage) => (
                        <div
                            key={stage.id}
                            className="flex-shrink-0 w-80 bg-slate-100 rounded-xl p-4"
                        >
                            {/* Stage Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <h3 className="font-semibold text-slate-900">{stage.name}</h3>
                                </div>
                                <span
                                    className="px-2 py-1 rounded-full text-sm font-medium"
                                    style={{ backgroundColor: `${stage.color}20`, color: stage.color }}
                                >
                                    {stage.count}
                                </span>
                            </div>

                            {/* Stage Projects */}
                            <div className="space-y-3">
                                {stage.projects.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/projects/${item.projectId}`}
                                        className="block bg-white rounded-lg p-4 shadow-sm border border-slate-200 hover:shadow-md hover:border-slate-300 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-slate-900">{item.project?.name}</h4>
                                            <ArrowLeft size={16} className="text-slate-400" />
                                        </div>

                                        {/* Average Score */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="text-xs text-slate-500">المتوسط:</div>
                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full"
                                                    style={{
                                                        width: `${((item.selfAssessment.strategic +
                                                            item.selfAssessment.operations +
                                                            item.selfAssessment.technology +
                                                            item.selfAssessment.data +
                                                            item.selfAssessment.customerExperience) / 5 / 5) * 100}%`
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">
                                                {((item.selfAssessment.strategic +
                                                    item.selfAssessment.operations +
                                                    item.selfAssessment.technology +
                                                    item.selfAssessment.data +
                                                    item.selfAssessment.customerExperience) / 5).toFixed(1)}
                                            </span>
                                        </div>

                                        {/* Meta info */}
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            {item.assignedEvaluators.length > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <User size={12} />
                                                    {item.assignedEvaluators.length} مقيمين
                                                </span>
                                            )}
                                            {item.meetingDate && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} />
                                                    {new Date(item.meetingDate).toLocaleDateString('ar-SA')}
                                                </span>
                                            )}
                                        </div>
                                    </Link>
                                ))}

                                {stage.count === 0 && (
                                    <div className="text-center py-8 text-slate-400 text-sm">
                                        لا توجد مشاريع في هذه المرحلة
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-semibold text-slate-900 mb-4">دليل المراحل</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {stages.map((stage) => (
                            <div key={stage.id} className="flex items-center gap-2">
                                <div
                                    className="w-4 h-4 rounded-full"
                                    style={{ backgroundColor: stage.color }}
                                />
                                <span className="text-sm text-slate-600">{stage.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
