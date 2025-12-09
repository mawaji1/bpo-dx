'use client';

import { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import PillarRadarChart from '@/components/PillarRadarChart';
import Tooltip from '@/components/Tooltip';
import { ArrowRight, Calendar, User, FileText, Sparkles, Save, Loader2, Check, UserPlus, X, Info } from 'lucide-react';
import Link from 'next/link';

interface Props {
    params: Promise<{ id: string }>;
}

interface Assessment {
    strategic: number;
    operations: number;
    technology: number;
    data: number;
    customerExperience: number;
}

interface Evaluation {
    id: string;
    projectId: string;
    submissionId: string;
    selfAssessment: Assessment;
    committeeAssessment: Assessment | null;
    stage: string;
    meetingNotes: string;
    llmRoadmap: string | null;
    assignedEvaluators: string[];
    meetingDate: string | null;
}

interface Project {
    id: string;
    name: string;
    departmentId: string;
    programManager: string;
    city: string;
}

interface Department {
    id: string;
    name: string;
}

interface UserType {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string | null;
}

const pillarNames: Record<string, string> = {
    strategic: 'البعد الاستراتيجي',
    operations: 'العمليات الرقمية',
    technology: 'التقنيات والأدوات',
    data: 'البيانات والتحليلات',
    customerExperience: 'تجربة العملاء'
};

const levelNames: Record<number, string> = {
    1: 'الأساس',
    2: 'النمو',
    3: 'النضج',
    4: 'التميز',
    5: 'الريادة'
};

export default function ProjectDetailPage({ params }: Props) {
    const { id } = use(params);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
    const [assigningEvaluators, setAssigningEvaluators] = useState(false);
    const [showEvaluatorModal, setShowEvaluatorModal] = useState(false);

    const [project, setProject] = useState<Project | null>(null);
    const [department, setDepartment] = useState<Department | null>(null);
    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [evaluators, setEvaluators] = useState<UserType[]>([]);
    const [selectedEvaluators, setSelectedEvaluators] = useState<string[]>([]);

    const [committeeScores, setCommitteeScores] = useState<Assessment>({
        strategic: 3,
        operations: 3,
        technology: 3,
        data: 3,
        customerExperience: 3
    });
    const [meetingNotes, setMeetingNotes] = useState('');
    const [meetingDate, setMeetingDate] = useState('');
    const [savingMeeting, setSavingMeeting] = useState(false);
    const [roadmap, setRoadmap] = useState<string | null>(null);
    const [definitions, setDefinitions] = useState<Record<string, { levels: Record<string, string> }>>({});
    const [selfComments, setSelfComments] = useState<Record<string, string>>({});
    const [committeeComments, setCommitteeComments] = useState<Record<string, string>>({
        strategic: '',
        operations: '',
        technology: '',
        data: '',
        customerExperience: ''
    });

    useEffect(() => {
        fetchData();
    }, [id]);

    async function fetchData() {
        try {
            const [projectsRes, deptsRes, evalsRes, usersRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/departments'),
                fetch('/api/evaluations'),
                fetch('/api/users')
            ]);

            if (projectsRes.ok && deptsRes.ok && evalsRes.ok) {
                const projects = await projectsRes.json();
                const depts = await deptsRes.json();
                const evals = await evalsRes.json();

                const proj = projects.find((p: Project) => p.id === id);
                const dept = depts.find((d: Department) => d.id === proj?.departmentId);
                const eval_ = evals.find((e: Evaluation) => e.projectId === id);

                setProject(proj || null);
                setDepartment(dept || null);
                setEvaluation(eval_ || null);

                if (eval_) {
                    if (eval_.committeeAssessment) {
                        setCommitteeScores(eval_.committeeAssessment);
                    } else if (eval_.selfAssessment) {
                        setCommitteeScores(eval_.selfAssessment);
                    }
                    setMeetingNotes(eval_.meetingNotes || '');
                    setMeetingDate(eval_.meetingDate || '');
                    setRoadmap(eval_.llmRoadmap || null);
                    setSelectedEvaluators(eval_.assignedEvaluators || []);

                    // Fetch self-assessment comments from submission
                    if (eval_.submissionId) {
                        const subRes = await fetch(`/api/submissions/${eval_.submissionId}`);
                        if (subRes.ok) {
                            const subData = await subRes.json();
                            setSelfComments(subData.comments || {});
                        }
                    }
                }
            }

            if (usersRes.ok) {
                const users = await usersRes.json();
                setEvaluators(users.filter((u: UserType) => u.role === 'evaluator'));
            }

            // Fetch maturity definitions
            const defsRes = await fetch('/api/definitions');
            if (defsRes.ok) {
                const defs = await defsRes.json();
                setDefinitions(defs.pillars || {});
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!evaluation) return;

        setSaving(true);
        try {
            const res = await fetch(`/api/evaluations/${evaluation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    committeeAssessment: committeeScores,
                    meetingNotes,
                    stage: 'committee_evaluated'
                })
            });

            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 2000);
                const updated = await res.json();
                setEvaluation(updated);
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleAssignEvaluators() {
        setAssigningEvaluators(true);
        try {
            // Use project-level assignment API (works with or without evaluation)
            const res = await fetch(`/api/projects/${id}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ evaluatorIds: selectedEvaluators })
            });

            if (res.ok) {
                const updated = await res.json();
                setEvaluation(updated);
            }
        } catch (error) {
            console.error('Error assigning:', error);
        } finally {
            setAssigningEvaluators(false);
        }
    }

    async function handleScheduleMeeting() {
        if (!evaluation || !meetingDate) return;

        setSavingMeeting(true);
        try {
            const res = await fetch(`/api/evaluations/${evaluation.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ meetingDate })
            });

            if (res.ok) {
                const updated = await res.json();
                setEvaluation(updated);
            }
        } catch (error) {
            console.error('Error scheduling meeting:', error);
        } finally {
            setSavingMeeting(false);
        }
    }

    async function handleGenerateRoadmap() {
        if (!evaluation) return;

        setGeneratingRoadmap(true);
        try {
            const res = await fetch('/api/llm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: id })
            });

            if (res.ok) {
                const data = await res.json();
                setRoadmap(data.roadmap);
            }
        } catch (error) {
            console.error('Error generating roadmap:', error);
        } finally {
            setGeneratingRoadmap(false);
        }
    }

    function toggleEvaluator(evaluatorId: string) {
        setSelectedEvaluators(prev =>
            prev.includes(evaluatorId)
                ? prev.filter(id => id !== evaluatorId)
                : [...prev, evaluatorId]
        );
    }

    const getLevelColor = (score: number) => {
        if (score >= 4.5) return 'bg-green-100 text-green-700 border-green-200';
        if (score >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200';
        if (score >= 2.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        if (score >= 1.5) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600 mb-4">المشروع غير موجود</p>
                    <Link href="/projects" className="btn btn-primary">
                        العودة للمشاريع
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="mr-64 p-8">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                    <Link href="/projects" className="hover:text-blue-600">المشاريع</Link>
                    <ArrowRight size={14} />
                    <span className="text-slate-900">{project.name}</span>
                </div>

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
                            <p className="text-slate-600 mt-1">{department?.name} • {project.programManager}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {evaluation && (
                                <span className="px-4 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                                    {evaluation.stage === 'self_submitted' ? 'تم التقييم الذاتي' :
                                        evaluation.stage === 'under_review' ? 'قيد المراجعة' :
                                            evaluation.stage === 'committee_evaluated' ? 'تم تقييم اللجنة' :
                                                evaluation.stage}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {evaluation ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Self Assessment Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-6">التقييم الذاتي</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        {Object.entries(evaluation.selfAssessment).map(([key, value]) => (
                                            <div key={key} className="flex items-center gap-4">
                                                <div className="w-32 text-sm text-slate-600 flex items-center gap-1">
                                                    {pillarNames[key]}
                                                    {selfComments[key] && (
                                                        <Tooltip content={selfComments[key]} position="left">
                                                            <Info size={14} className="text-blue-500 cursor-help" />
                                                        </Tooltip>
                                                    )}
                                                </div>
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-600 rounded-full"
                                                        style={{ width: `${(value / 5) * 100}%` }}
                                                    />
                                                </div>
                                                <div className={`px-3 py-1 rounded-lg text-sm font-medium border ${getLevelColor(value)}`}>
                                                    {value} - {levelNames[value]}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <PillarRadarChart
                                        selfAssessment={evaluation.selfAssessment}
                                        committeeAssessment={evaluation.committeeAssessment || undefined}
                                        showLegend={true}
                                    />
                                </div>
                            </div>

                            {/* Committee Evaluation Form */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-semibold text-slate-900">تقييم اللجنة</h2>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Info size={14} />
                                        <span>مرر على الدرجات لعرض التعريف</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {Object.entries(committeeScores).map(([key, value]) => (
                                        <div key={key} className="border border-slate-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="font-medium text-slate-900">{pillarNames[key]}</div>
                                                <div className="text-sm text-slate-500">
                                                    التقييم الذاتي: <span className="font-medium text-slate-700">
                                                        {evaluation.selfAssessment[key as keyof Assessment]}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 mb-4">
                                                {[1, 2, 3, 4, 5].map((score) => (
                                                    <Tooltip
                                                        key={score}
                                                        content={definitions[key]?.levels?.[score.toString()] || `المستوى ${score}`}
                                                        position="top"
                                                        className="flex-1"
                                                    >
                                                        <button
                                                            onClick={() => setCommitteeScores({ ...committeeScores, [key]: score })}
                                                            className={`w-full py-3 px-2 rounded-lg border-2 transition-all ${value === score
                                                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                                : 'border-slate-200 hover:border-slate-300 text-slate-600'
                                                                }`}
                                                        >
                                                            <div className="text-lg font-bold">{score}</div>
                                                            <div className="text-xs">{levelNames[score]}</div>
                                                        </button>
                                                    </Tooltip>
                                                ))}
                                            </div>

                                            {/* Evaluator comment per pillar */}
                                            <textarea
                                                value={committeeComments[key] || ''}
                                                onChange={(e) => setCommitteeComments({ ...committeeComments, [key]: e.target.value })}
                                                placeholder="ملاحظات المقيّم على هذا المحور..."
                                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                rows={2}
                                            />
                                        </div>
                                    ))}

                                    {/* Meeting Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            ملاحظات الاجتماع
                                        </label>
                                        <textarea
                                            value={meetingNotes}
                                            onChange={e => setMeetingNotes(e.target.value)}
                                            placeholder="ملخص نقاط الاجتماع مع فريق المشروع..."
                                            className="w-full px-4 py-3 border border-slate-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            rows={4}
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn btn-primary flex-1"
                                        >
                                            {saving ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : saved ? (
                                                <Check size={18} />
                                            ) : (
                                                <Save size={18} />
                                            )}
                                            {saved ? 'تم الحفظ' : 'حفظ التقييم'}
                                        </button>
                                        <button
                                            onClick={handleGenerateRoadmap}
                                            disabled={generatingRoadmap}
                                            className="btn btn-secondary"
                                        >
                                            {generatingRoadmap ? (
                                                <Loader2 size={18} className="animate-spin" />
                                            ) : (
                                                <Sparkles size={18} />
                                            )}
                                            {generatingRoadmap ? 'جاري التوليد...' : 'توليد خارطة طريق (AI)'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* LLM Roadmap */}
                            {roadmap && (
                                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                    <h2 className="text-lg font-semibold text-slate-900 mb-4">خارطة الطريق المقترحة</h2>
                                    <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">
                                        {roadmap}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Project Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-900 mb-4">معلومات المشروع</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">الإدارة</span>
                                        <span className="text-slate-900">{department?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">مدير البرنامج</span>
                                        <span className="text-slate-900">{project.programManager}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">المدينة</span>
                                        <span className="text-slate-900">{project.city}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluator Assignment */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-900">المقيّمون</h3>
                                    <button
                                        onClick={() => setShowEvaluatorModal(true)}
                                        className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                                        title="تعيين مقيّمين"
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                </div>

                                {/* Show assigned evaluators */}
                                {selectedEvaluators.length > 0 ? (
                                    <div className="space-y-2">
                                        {evaluators
                                            .filter(e => selectedEvaluators.includes(e.id))
                                            .map(evaluator => (
                                                <div
                                                    key={evaluator.id}
                                                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <User size={14} className="text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{evaluator.name}</div>
                                                        <div className="text-xs text-slate-500">{evaluator.department}</div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-sm">
                                        <User className="mx-auto mb-2 text-slate-300" size={24} />
                                        لم يتم تعيين مقيّمين بعد
                                    </div>
                                )}
                            </div>

                            {/* Meeting */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-900 mb-4">موعد الاجتماع</h3>

                                {evaluation.meetingDate && (
                                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
                                        <Calendar className="text-green-600" size={20} />
                                        <div>
                                            <div className="text-xs text-green-600">الموعد المحدد</div>
                                            <div className="text-sm font-medium text-green-900">
                                                {new Date(evaluation.meetingDate).toLocaleDateString('ar-SA', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-sm text-slate-600">تحديد موعد جديد</label>
                                    <input
                                        type="date"
                                        value={meetingDate}
                                        onChange={e => setMeetingDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                        onClick={handleScheduleMeeting}
                                        disabled={savingMeeting || !meetingDate}
                                        className="btn btn-primary w-full"
                                    >
                                        {savingMeeting ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Calendar size={16} />
                                        )}
                                        حفظ الموعد
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">لم يتم التقييم بعد</h3>
                                <p className="text-slate-500">هذا المشروع لم يقدم تقييماً ذاتياً حتى الآن</p>
                            </div>
                        </div>

                        {/* Sidebar with Assignment for projects without evaluation */}
                        <div className="space-y-6">
                            {/* Project Info */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="font-semibold text-slate-900 mb-4">معلومات المشروع</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">الإدارة</span>
                                        <span className="text-slate-900">{department?.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">مدير البرنامج</span>
                                        <span className="text-slate-900">{project.programManager}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">المدينة</span>
                                        <span className="text-slate-900">{project.city}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Evaluator Assignment - available even without evaluation */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-slate-900">المقيّمون</h3>
                                    <button
                                        onClick={() => setShowEvaluatorModal(true)}
                                        className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center text-blue-600 transition-colors"
                                        title="تعيين مقيّمين"
                                    >
                                        <UserPlus size={16} />
                                    </button>
                                </div>
                                <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
                                    يمكنك تعيين مقيّمين للمتابعة حتى قبل إرسال التقييم الذاتي
                                </p>

                                {/* Show assigned evaluators */}
                                {selectedEvaluators.length > 0 ? (
                                    <div className="space-y-2">
                                        {evaluators
                                            .filter(e => selectedEvaluators.includes(e.id))
                                            .map(evaluator => (
                                                <div
                                                    key={evaluator.id}
                                                    className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <User size={14} className="text-purple-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium">{evaluator.name}</div>
                                                        <div className="text-xs text-slate-500">{evaluator.department}</div>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-slate-400 text-sm">
                                        <User className="mx-auto mb-2 text-slate-300" size={24} />
                                        لم يتم تعيين مقيّمين بعد
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Evaluator Selection Modal */}
            {showEvaluatorModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">تعيين المقيّمين</h2>
                            <button
                                onClick={() => setShowEvaluatorModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                            {evaluators.map(evaluator => (
                                <label
                                    key={evaluator.id}
                                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedEvaluators.includes(evaluator.id)
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'bg-slate-50 hover:bg-slate-100 border border-transparent'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedEvaluators.includes(evaluator.id)}
                                        onChange={() => toggleEvaluator(evaluator.id)}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                        <User size={14} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{evaluator.name}</div>
                                        <div className="text-xs text-slate-500">{evaluator.department}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-slate-200">
                            <button
                                onClick={async () => {
                                    await handleAssignEvaluators();
                                    setShowEvaluatorModal(false);
                                }}
                                disabled={assigningEvaluators}
                                className="btn btn-primary flex-1"
                            >
                                {assigningEvaluators ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <UserPlus size={16} />
                                )}
                                حفظ التعيينات
                            </button>
                            <button
                                onClick={() => setShowEvaluatorModal(false)}
                                className="btn btn-secondary"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
