'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/Sidebar';
import Link from 'next/link';
import { Search, Plus, ArrowLeft, Loader2, X, Pencil, Trash2 } from 'lucide-react';

interface Project {
    id: string;
    name: string;
    departmentId: string;
    programManager: string;
    city: string;
    submissionId: string | null;
}

interface Department {
    id: string;
    name: string;
}

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
    stage: string;
}

interface StageConfig {
    id: string;
    name: string;
    color: string;
}

export default function ProjectsPage() {
    const { data: session, status } = useSession();
    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [stages, setStages] = useState<StageConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        departmentId: '',
        programManager: '',
        city: 'الرياض'
    });

    const isEvaluator = session?.user?.role === 'evaluator';
    const userId = session?.user?.id;

    useEffect(() => {
        if (status !== 'loading') fetchData();
    }, [status]);

    async function fetchData() {
        try {
            const [projRes, deptRes, evalRes, configRes] = await Promise.all([
                fetch('/api/projects'),
                fetch('/api/departments'),
                fetch('/api/evaluations'),
                fetch('/api/config')
            ]);

            let projectsData = projRes.ok ? await projRes.json() : [];
            let evalsData = evalRes.ok ? await evalRes.json() : [];
            const deptsData = deptRes.ok ? await deptRes.json() : [];

            // Filter for evaluator
            if (isEvaluator && userId) {
                const assignedEvals = evalsData.filter((e: any) =>
                    e.assignedEvaluators?.includes(userId)
                );
                const assignedProjectIds = assignedEvals.map((e: any) => e.projectId);
                projectsData = projectsData.filter((p: Project) =>
                    assignedProjectIds.includes(p.id)
                );
                evalsData = assignedEvals;
            }

            setProjects(projectsData);
            setDepartments(deptsData);
            setEvaluations(evalsData);

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

    function openAddModal() {
        setEditingProject(null);
        setFormData({
            name: '',
            departmentId: departments[0]?.id || '',
            programManager: '',
            city: 'الرياض'
        });
        setShowModal(true);
    }

    function openEditModal(project: Project) {
        setEditingProject(project);
        setFormData({
            name: project.name,
            departmentId: project.departmentId,
            programManager: project.programManager,
            city: project.city
        });
        setShowModal(true);
    }

    async function handleSave() {
        if (!formData.name || !formData.departmentId) return;

        setSaving(true);
        try {
            if (editingProject) {
                // Update
                const res = await fetch(`/api/projects/${editingProject.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    await fetchData();
                    setShowModal(false);
                } else {
                    const err = await res.json();
                    alert(err.error);
                }
            } else {
                // Create
                const res = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
                if (res.ok) {
                    await fetchData();
                    setShowModal(false);
                } else {
                    const err = await res.json();
                    alert(err.error);
                }
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(project: Project) {
        if (!confirm(`هل أنت متأكد من حذف "${project.name}"؟`)) return;

        try {
            const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchData();
            }
        } catch (error) {
            console.error('Error deleting:', error);
        }
    }

    const projectsWithData = projects.map(project => {
        const department = departments.find(d => d.id === project.departmentId);
        const evaluation = evaluations.find(e => e.projectId === project.id);
        const stage = stages.find(s => s.id === (evaluation?.stage || 'pending'));

        let avgScore = 0;
        if (evaluation) {
            avgScore = (
                evaluation.selfAssessment.strategic +
                evaluation.selfAssessment.operations +
                evaluation.selfAssessment.technology +
                evaluation.selfAssessment.data +
                evaluation.selfAssessment.customerExperience
            ) / 5;
        }

        return { ...project, department, evaluation, stage, avgScore };
    });

    const filteredProjects = projectsWithData.filter(p => {
        const matchesSearch = !searchTerm ||
            p.name.includes(searchTerm) ||
            p.programManager.includes(searchTerm);
        const matchesDept = !filterDept || p.departmentId === filterDept;
        return matchesSearch && matchesDept;
    });

    const getLevelColor = (score: number) => {
        if (score >= 4.5) return 'bg-green-100 text-green-700';
        if (score >= 3.5) return 'bg-blue-100 text-blue-700';
        if (score >= 2.5) return 'bg-yellow-100 text-yellow-700';
        if (score >= 1.5) return 'bg-orange-100 text-orange-700';
        return 'bg-red-100 text-red-700';
    };

    if (loading) {
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
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">المشاريع</h1>
                        <p className="text-slate-600 mt-1">جميع مشاريع قطاع إسناد الأعمال ({projects.length} مشروع)</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="بحث عن مشروع..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="input pr-10 w-64"
                            />
                        </div>
                        <select
                            value={filterDept}
                            onChange={e => setFilterDept(e.target.value)}
                            className="input"
                        >
                            <option value="">جميع الإدارات</option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        {!isEvaluator && (
                            <button onClick={openAddModal} className="btn btn-primary">
                                <Plus size={18} />
                                إضافة مشروع
                            </button>
                        )}
                    </div>
                </div>

                {/* Projects Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">المشروع</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">الإدارة</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">مدير البرنامج</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">المدينة</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">المرحلة</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">المتوسط</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map((project) => (
                                <tr
                                    key={project.id}
                                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                                >
                                    <td className="py-4 px-6">
                                        <div className="font-medium text-slate-900">{project.name}</div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-600">{project.department?.name || '-'}</td>
                                    <td className="py-4 px-6 text-slate-600">{project.programManager}</td>
                                    <td className="py-4 px-6 text-slate-600">{project.city}</td>
                                    <td className="py-4 px-6 text-center">
                                        {project.stage ? (
                                            <span
                                                className="px-3 py-1 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${project.stage.color}20`,
                                                    color: project.stage.color
                                                }}
                                            >
                                                {project.stage.name}
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500">
                                                لم يُقيَّم
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 text-center">
                                        {project.evaluation ? (
                                            <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getLevelColor(project.avgScore)}`}>
                                                {project.avgScore.toFixed(1)}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="التفاصيل"
                                            >
                                                <ArrowLeft size={16} />
                                            </Link>
                                            <button
                                                onClick={() => openEditModal(project)}
                                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                title="تعديل"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(project)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="حذف"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Stats Footer */}
                <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
                    <div>عرض {filteredProjects.length} من {projects.length} مشروع</div>
                    <div className="flex items-center gap-4">
                        <span>المُقيَّمة: {evaluations.length}</span>
                        <span>في الانتظار: {projects.length - evaluations.length}</span>
                    </div>
                </div>
            </main>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">
                                {editingProject ? 'تعديل المشروع' : 'إضافة مشروع جديد'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">اسم المشروع *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    placeholder="مثال: مشروع التحول الرقمي"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">الإدارة *</label>
                                <select
                                    value={formData.departmentId}
                                    onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                    className="input"
                                >
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">مدير البرنامج</label>
                                <input
                                    type="text"
                                    value={formData.programManager}
                                    onChange={e => setFormData({ ...formData, programManager: e.target.value })}
                                    className="input"
                                    placeholder="الاسم الكامل"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">المدينة</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="input"
                                    placeholder="الرياض"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !formData.name || !formData.departmentId}
                                    className="btn btn-primary flex-1"
                                >
                                    {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                                    {editingProject ? 'حفظ التغييرات' : 'إضافة المشروع'}
                                </button>
                                <button onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    إلغاء
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
