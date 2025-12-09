'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { FileCheck, Link2, AlertCircle, CheckCircle, ArrowLeft, Plus, X, Loader2 } from 'lucide-react';

interface Submission {
    id: string;
    projectName: string;
    programManager: string;
    createdAt: string;
    mapped: boolean;
}

interface Project {
    id: string;
    name: string;
    departmentId: string;
    submissionId: string | null;
}

interface Department {
    id: string;
    name: string;
}

export default function OnboardingPage() {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [mapping, setMapping] = useState<string | null>(null);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<Record<string, string>>({});

    const [newProject, setNewProject] = useState({
        name: '',
        departmentId: '',
        programManager: '',
        city: 'الرياض'
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [subsRes, projRes, deptRes] = await Promise.all([
                fetch('/api/submissions'),
                fetch('/api/projects'),
                fetch('/api/departments')
            ]);

            if (subsRes.ok) setSubmissions(await subsRes.json());
            if (projRes.ok) setProjects(await projRes.json());
            if (deptRes.ok) setDepartments(await deptRes.json());
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleMap(submission: Submission) {
        const projectId = selectedProjectId[submission.id];
        if (!projectId) return;

        if (projectId === 'new') {
            setSelectedSubmission(submission);
            setNewProject({
                name: submission.projectName,
                departmentId: departments[0]?.id || '',
                programManager: submission.programManager,
                city: 'الرياض'
            });
            setShowNewProjectModal(true);
            return;
        }

        setMapping(submission.id);
        try {
            const res = await fetch('/api/projects/map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: submission.id,
                    projectId: projectId
                })
            });

            if (res.ok) {
                // Refresh data
                await fetchData();
            }
        } catch (error) {
            console.error('Error mapping:', error);
        } finally {
            setMapping(null);
        }
    }

    async function handleCreateAndMap() {
        if (!selectedSubmission) return;

        setMapping(selectedSubmission.id);
        try {
            const res = await fetch('/api/projects/map', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    submissionId: selectedSubmission.id,
                    createNew: true,
                    newProjectData: newProject
                })
            });

            if (res.ok) {
                setShowNewProjectModal(false);
                setSelectedSubmission(null);
                await fetchData();
            }
        } catch (error) {
            console.error('Error creating project:', error);
        } finally {
            setMapping(null);
        }
    }

    const unmappedSubmissions = submissions.filter(s => !s.mapped);
    const mappedSubmissions = submissions.filter(s => s.mapped);
    const unmappedProjects = projects.filter(p => !p.submissionId);

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
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">ربط الاستجابات</h1>
                    <p className="text-slate-600 mt-1">ربط استجابات التقييم الذاتي بالمشاريع المسجلة في النظام</p>
                </div>

                {/* Info Banner */}
                {unmappedSubmissions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertCircle className="text-blue-600 mt-0.5" size={20} />
                        <div>
                            <div className="font-medium text-blue-900">استجابات جديدة متاحة</div>
                            <div className="text-sm text-blue-700 mt-1">
                                يوجد {unmappedSubmissions.length} استجابات من منصة elmiyaar بحاجة للربط بالمشاريع المناسبة
                            </div>
                        </div>
                    </div>
                )}

                {/* Unmapped Submissions */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">استجابات غير مربوطة</h2>
                    </div>

                    {unmappedSubmissions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                            جميع الاستجابات مربوطة بالمشاريع
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {unmappedSubmissions.map((submission) => (
                                <div key={submission.id} className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                                    <FileCheck className="text-amber-600" size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{submission.projectName}</div>
                                                    <div className="text-sm text-slate-500">
                                                        {submission.programManager} • {new Date(submission.createdAt).toLocaleDateString('ar-SA')}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mapping Form */}
                                            <div className="mt-4 flex items-center gap-4">
                                                <div className="flex-1">
                                                    <select
                                                        className="input"
                                                        value={selectedProjectId[submission.id] || ''}
                                                        onChange={e => setSelectedProjectId({
                                                            ...selectedProjectId,
                                                            [submission.id]: e.target.value
                                                        })}
                                                    >
                                                        <option value="">اختر المشروع المناسب...</option>
                                                        {unmappedProjects.map((project) => (
                                                            <option key={project.id} value={project.id}>
                                                                {project.name}
                                                            </option>
                                                        ))}
                                                        <option value="new">+ إضافة مشروع جديد</option>
                                                    </select>
                                                </div>
                                                <button
                                                    className="btn btn-primary"
                                                    disabled={!selectedProjectId[submission.id] || mapping === submission.id}
                                                    onClick={() => handleMap(submission)}
                                                >
                                                    {mapping === submission.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Link2 size={16} />
                                                    )}
                                                    ربط
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recently Mapped */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-200">
                        <h2 className="text-lg font-semibold text-slate-900">تم ربطها ({mappedSubmissions.length})</h2>
                    </div>

                    {mappedSubmissions.length === 0 ? (
                        <div className="p-6 text-center text-slate-400">لا توجد استجابات مربوطة بعد</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {mappedSubmissions.map((sub) => {
                                const project = projects.find(p => p.submissionId === sub.id);
                                return (
                                    <div key={sub.id} className="p-4 flex items-center gap-4">
                                        <CheckCircle className="text-green-600" size={20} />
                                        <div className="flex-1">
                                            <span className="text-slate-900">{sub.projectName}</span>
                                            <ArrowLeft className="inline mx-2 text-slate-400" size={14} />
                                            <span className="text-blue-600">{project?.name || 'مشروع'}</span>
                                        </div>
                                        <span className="text-sm text-slate-500">
                                            {new Date(sub.createdAt).toLocaleDateString('ar-SA')}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* New Project Modal */}
            {showNewProjectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-slate-900">إضافة مشروع جديد</h2>
                            <button
                                onClick={() => setShowNewProjectModal(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">اسم المشروع</label>
                                <input
                                    type="text"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">الإدارة</label>
                                <select
                                    value={newProject.departmentId}
                                    onChange={e => setNewProject({ ...newProject, departmentId: e.target.value })}
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
                                    value={newProject.programManager}
                                    onChange={e => setNewProject({ ...newProject, programManager: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">المدينة</label>
                                <input
                                    type="text"
                                    value={newProject.city}
                                    onChange={e => setNewProject({ ...newProject, city: e.target.value })}
                                    className="input"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateAndMap}
                                    disabled={!newProject.name || mapping}
                                    className="btn btn-primary flex-1"
                                >
                                    {mapping ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                    إضافة وربط
                                </button>
                                <button
                                    onClick={() => setShowNewProjectModal(false)}
                                    className="btn btn-secondary"
                                >
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
