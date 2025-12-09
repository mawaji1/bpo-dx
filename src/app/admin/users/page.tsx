'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { User, Shield, Building2, Plus, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'evaluator';
    department: string | null;
    assignedProjects: string[];
    mustChangePassword?: boolean;
}

interface Config {
    evaluatorDepartments: { id: string; name: string }[];
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'evaluator' as 'admin' | 'evaluator',
        department: '',
        mustChangePassword: true
    });

    const [evaluations, setEvaluations] = useState<{ assignedEvaluators: string[] }[]>([]);

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [usersRes, configRes, evalsRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/config'),
                fetch('/api/evaluations')
            ]);
            if (usersRes.ok) {
                setUsers(await usersRes.json());
            }
            if (configRes.ok) {
                setConfig(await configRes.json());
            }
            if (evalsRes.ok) {
                setEvaluations(await evalsRes.json());
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        try {
            if (editingUser) {
                // Update existing user
                const res = await fetch(`/api/users/${editingUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: formData.name,
                        email: formData.email,
                        role: formData.role,
                        department: formData.department || null,
                        mustChangePassword: formData.mustChangePassword,
                        ...(formData.password && { password: formData.password })
                    })
                });
                if (res.ok) {
                    const updated = await res.json();
                    setUsers(users.map(u => u.id === updated.id ? updated : u));
                    resetForm();
                }
            } else {
                // Create new user
                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        mustChangePassword: formData.mustChangePassword
                    })
                });
                if (res.ok) {
                    const newUser = await res.json();
                    setUsers([...users, newUser]);
                    resetForm();
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setUsers(users.filter(u => u.id !== id));
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        } finally {
            setDeleting(null);
        }
    }

    function startEdit(user: UserData) {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            department: user.department || '',
            mustChangePassword: user.mustChangePassword || false
        });
        setShowForm(true);
    }

    function resetForm() {
        setShowForm(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'evaluator', department: '', mustChangePassword: true });
    }

    // Count assigned projects from evaluations
    function getAssignedProjectCount(userId: string) {
        return evaluations.filter(e => e.assignedEvaluators?.includes(userId)).length;
    }

    const getRoleBadge = (role: string) => {
        if (role === 'admin') {
            return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">مدير</span>;
        }
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">مقيّم</span>;
    };

    const getDepartmentBadge = (department: string | null) => {
        if (!department) return <span className="text-slate-400">-</span>;
        const colors = department.includes('تميز')
            ? 'bg-amber-100 text-amber-700'
            : 'bg-green-100 text-green-700';
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{department}</span>;
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
                        <h1 className="text-2xl font-bold text-slate-900">إدارة المستخدمين</h1>
                        <p className="text-slate-600 mt-1">إدارة أعضاء لجنة التقييم وصلاحياتهم</p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn btn-primary"
                    >
                        <Plus size={18} />
                        إضافة مستخدم
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Shield className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {users.filter(u => u.role === 'admin').length}
                                </div>
                                <div className="text-sm text-slate-500">مديرين</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Building2 className="text-amber-600" size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {users.filter(u => u.department?.includes('تميز')).length}
                                </div>
                                <div className="text-sm text-slate-500">إدارة تميز الأعمال</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Building2 className="text-green-600" size={20} />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">
                                    {users.filter(u => u.department?.includes('التقنية')).length}
                                </div>
                                <div className="text-sm text-slate-500">إدارة التقنية</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">المستخدم</th>
                                <th className="text-right py-4 px-6 text-sm font-medium text-slate-600">البريد الإلكتروني</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">الدور</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">الإدارة</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">المشاريع</th>
                                <th className="text-center py-4 px-6 text-sm font-medium text-slate-600">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                                <User className="text-slate-600" size={20} />
                                            </div>
                                            <div className="font-medium text-slate-900">{user.name}</div>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-slate-600">{user.email}</td>
                                    <td className="py-4 px-6 text-center">{getRoleBadge(user.role)}</td>
                                    <td className="py-4 px-6 text-center">{getDepartmentBadge(user.department)}</td>
                                    <td className="py-4 px-6 text-center text-slate-600">
                                        {getAssignedProjectCount(user.id)}
                                    </td>
                                    <td className="py-4 px-6">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => startEdit(user)}
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                disabled={deleting === user.id}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {deleting === user.id ? (
                                                    <Loader2 size={16} className="animate-spin" />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add/Edit User Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-slate-900">
                                    {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                                </h2>
                                <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">الاسم</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        كلمة المرور {editingUser && '(اتركها فارغة للإبقاء على القديمة)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        className="input"
                                        required={!editingUser}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">الدور</label>
                                    <select
                                        value={formData.role}
                                        onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'evaluator' })}
                                        className="input"
                                    >
                                        <option value="evaluator">مقيّم</option>
                                        <option value="admin">مدير</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">الإدارة</label>
                                    <select
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                        className="input"
                                    >
                                        <option value="">بدون إدارة</option>
                                        <option value="إدارة تميز الأعمال">إدارة تميز الأعمال</option>
                                        <option value="إدارة التقنية">إدارة التقنية</option>
                                    </select>
                                </div>

                                {/* Force Password Change */}
                                <div className="flex items-center gap-3 py-2">
                                    <input
                                        type="checkbox"
                                        id="mustChangePassword"
                                        checked={formData.mustChangePassword}
                                        onChange={e => setFormData({ ...formData, mustChangePassword: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="mustChangePassword" className="text-sm text-slate-700">
                                        تغيير كلمة المرور عند الدخول التالي
                                    </label>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="btn btn-primary flex-1"
                                    >
                                        {saving ? (
                                            <Loader2 size={18} className="animate-spin" />
                                        ) : (
                                            <Check size={18} />
                                        )}
                                        {editingUser ? 'حفظ التعديلات' : 'إضافة'}
                                    </button>
                                    <button type="button" onClick={resetForm} className="btn btn-secondary">
                                        إلغاء
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
