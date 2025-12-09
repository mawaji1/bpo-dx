'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Settings, Save, Loader2, Check, Palette, Globe, Lock } from 'lucide-react';

export default function SettingsPage() {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [settings, setSettings] = useState({
        siteName: 'مقياس نضج التحول الرقمي',
        siteDescription: 'منصة تقييم نضج التحول الرقمي لمشاريع قطاع إسناد الأعمال',
        primaryColor: '#2563eb',
        enableLLM: true,
        openaiModel: 'gpt-4o',
        maxRoadmapLength: 2000,
        autoAssignEvaluators: false,
        requireTwoEvaluators: true,
        allowSelfAssessmentEdit: false
    });

    async function handleSave() {
        setSaving(true);
        // Simulate saving
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    }

    return (
        <div className="min-h-screen">
            <Sidebar />

            <main className="mr-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">الإعدادات</h1>
                        <p className="text-slate-600 mt-1">إعدادات النظام والتكوين</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : saved ? (
                            <Check size={18} />
                        ) : (
                            <Save size={18} />
                        )}
                        {saved ? 'تم الحفظ' : 'حفظ الإعدادات'}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* General Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Globe className="text-blue-600" size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">الإعدادات العامة</h2>
                                <p className="text-sm text-slate-500">معلومات الموقع الأساسية</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">اسم الموقع</label>
                                <input
                                    type="text"
                                    value={settings.siteName}
                                    onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">وصف الموقع</label>
                                <textarea
                                    value={settings.siteDescription}
                                    onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                                    className="input resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Palette className="text-purple-600" size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">المظهر</h2>
                                <p className="text-sm text-slate-500">ألوان وتصميم الواجهة</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">اللون الأساسي</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="color"
                                        value={settings.primaryColor}
                                        onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="w-12 h-12 rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={settings.primaryColor}
                                        onChange={e => setSettings({ ...settings, primaryColor: e.target.value })}
                                        className="input flex-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* LLM Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                <Settings className="text-green-600" size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">الذكاء الاصطناعي</h2>
                                <p className="text-sm text-slate-500">إعدادات توليد خارطة الطريق</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">تفعيل توليد خارطة الطريق</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.enableLLM}
                                        onChange={e => setSettings({ ...settings, enableLLM: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">نموذج OpenAI</label>
                                <select
                                    value={settings.openaiModel}
                                    onChange={e => setSettings({ ...settings, openaiModel: e.target.value })}
                                    className="input"
                                >
                                    <option value="gpt-4o">GPT-4o (موصى به)</option>
                                    <option value="gpt-4o-mini">GPT-4o Mini (أسرع)</option>
                                    <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">الحد الأقصى للتوصيات</label>
                                <input
                                    type="number"
                                    value={settings.maxRoadmapLength}
                                    onChange={e => setSettings({ ...settings, maxRoadmapLength: parseInt(e.target.value) })}
                                    className="input"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Workflow Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                <Lock className="text-amber-600" size={20} />
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-900">سير العمل</h2>
                                <p className="text-sm text-slate-500">إعدادات عملية التقييم</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">التعيين التلقائي للمقيمين</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.autoAssignEvaluators}
                                        onChange={e => setSettings({ ...settings, autoAssignEvaluators: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">اشتراط مقيمين اثنين</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.requireTwoEvaluators}
                                        onChange={e => setSettings({ ...settings, requireTwoEvaluators: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">السماح بتعديل التقييم الذاتي</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.allowSelfAssessmentEdit}
                                        onChange={e => setSettings({ ...settings, allowSelfAssessmentEdit: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
