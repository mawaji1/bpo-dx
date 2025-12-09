'use client';

import { Building2, Users, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import PillarRadarChart from './PillarRadarChart';

interface DepartmentStats {
    id: string;
    name: string;
    projectCount: number;
    evaluatedCount: number;
    avgScores: {
        strategic: number;
        operations: number;
        technology: number;
        data: number;
        customerExperience: number;
    };
}

interface Pillar {
    id: string;
    name: string;
}

interface DepartmentCardProps {
    dept: DepartmentStats;
    pillars: Pillar[];
}

export default function DepartmentCard({ dept, pillars }: DepartmentCardProps) {
    const [expanded, setExpanded] = useState(false);

    const avgTotal = dept.evaluatedCount > 0
        ? (dept.avgScores.strategic + dept.avgScores.operations + dept.avgScores.technology + dept.avgScores.data + dept.avgScores.customerExperience) / 5
        : 0;

    const getLevelColor = (score: number) => {
        if (score >= 4.5) return 'bg-green-500';
        if (score >= 3.5) return 'bg-blue-500';
        if (score >= 2.5) return 'bg-yellow-500';
        if (score >= 1.5) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getLevelBadge = (score: number) => {
        if (score >= 4.5) return 'bg-green-100 text-green-700';
        if (score >= 3.5) return 'bg-blue-100 text-blue-700';
        if (score >= 2.5) return 'bg-yellow-100 text-yellow-700';
        if (score >= 1.5) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header */}
            <div
                className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Building2 className="text-blue-600" size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">{dept.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <span className="flex items-center gap-1">
                                    <Users size={14} />
                                    {dept.projectCount} مشروع
                                </span>
                                <span>|</span>
                                <span>{dept.evaluatedCount} مُقيَّم</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {dept.evaluatedCount > 0 && (
                            <div className={`px-4 py-2 rounded-lg font-bold ${getLevelBadge(avgTotal)}`}>
                                {avgTotal.toFixed(1)}
                            </div>
                        )}
                        <ChevronDown
                            size={20}
                            className={`text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                        />
                    </div>
                </div>

                {/* Progress bars preview */}
                {dept.evaluatedCount > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-2">
                        {Object.entries(dept.avgScores).map(([key, value]) => (
                            <div key={key} className="space-y-1">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${getLevelColor(value)}`}
                                        style={{ width: `${(value / 5) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Expanded content */}
            {expanded && dept.evaluatedCount > 0 && (
                <div className="border-t border-slate-200 p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pillar scores */}
                        <div>
                            <h4 className="font-medium text-slate-900 mb-4">تفاصيل المحاور</h4>
                            <div className="space-y-3">
                                {pillars.map((pillar) => {
                                    const score = dept.avgScores[pillar.id as keyof typeof dept.avgScores];
                                    return (
                                        <div key={pillar.id} className="flex items-center gap-4">
                                            <div className="w-28 text-sm text-slate-600">{pillar.name}</div>
                                            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${getLevelColor(score)}`}
                                                    style={{ width: `${(score / 5) * 100}%` }}
                                                />
                                            </div>
                                            <div className={`w-12 text-center py-1 rounded text-sm font-medium ${getLevelBadge(score)}`}>
                                                {score.toFixed(1)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Radar chart */}
                        <div>
                            <h4 className="font-medium text-slate-900 mb-4">الرسم البياني</h4>
                            <PillarRadarChart
                                selfAssessment={dept.avgScores}
                                showLegend={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            {!dept.evaluatedCount && expanded && (
                <div className="border-t border-slate-200 p-6 text-center text-slate-500">
                    لا توجد تقييمات بعد لهذه الإدارة
                </div>
            )}
        </div>
    );
}
