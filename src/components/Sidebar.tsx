'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import ChangePasswordModal from './ChangePasswordModal';
import {
    LayoutDashboard,
    FolderKanban,
    Building2,
    GitBranch,
    Settings,
    Users,
    FileCheck,
    LogOut,
    Loader2,
    ClipboardCheck,
    Lock
} from 'lucide-react';

const menuItems = [
    { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { href: '/projects', label: 'المشاريع', icon: FolderKanban },
    { href: '/pipeline', label: 'مراحل التقييم', icon: GitBranch },
    { href: '/departments', label: 'الإدارات', icon: Building2 },
];

const evaluatorItems = [
    { href: '/evaluator', label: 'مشاريعي', icon: ClipboardCheck },
];

const adminItems = [
    { href: '/admin/onboarding', label: 'ربط الاستجابات', icon: FileCheck },
    { href: '/admin/users', label: 'المستخدمين', icon: Users },
    { href: '/admin/settings', label: 'الإعدادات', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const handleLogout = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const isAdmin = session?.user?.role === 'admin';
    const isEvaluator = session?.user?.role === 'evaluator';

    return (
        <aside className="fixed top-0 right-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
            {/* Logo */}
            <div className="p-6 border-b border-slate-700">
                <h1 className="text-xl font-bold">مقياس النضج الرقمي</h1>
                <p className="text-slate-400 text-sm mt-1">قطاع إسناد الأعمال</p>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {/* My Tasks - for evaluators at top */}
                {isEvaluator && (
                    <>
                        <div className="text-slate-500 text-xs font-medium mb-2 px-4">مهامي</div>
                        {evaluatorItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-green-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                )}

                {/* Main menu - for everyone */}
                <div className={`text-slate-500 text-xs font-medium ${isEvaluator ? 'mt-6' : ''} mb-2 px-4`}>القائمة الرئيسية</div>
                {menuItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}

                {isAdmin && (
                    <>
                        <div className="text-slate-500 text-xs font-medium mt-6 mb-2 px-4">الإدارة</div>
                        {adminItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </>
                )}
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-slate-700">
                {status === 'loading' ? (
                    <div className="flex items-center justify-center py-4">
                        <Loader2 className="animate-spin text-slate-400" size={20} />
                    </div>
                ) : session?.user ? (
                    <div className="space-y-2">
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <Lock size={16} />
                            <span>تغيير كلمة المرور</span>
                        </button>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-sm font-medium">
                                    {session.user.name?.charAt(0) || 'م'}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{session.user.name}</div>
                                <div className="text-xs text-slate-400 truncate">{session.user.email}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-slate-400 hover:text-white transition-colors"
                                title="تسجيل الخروج"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors"
                    >
                        تسجيل الدخول
                    </Link>
                )}
            </div>

            {/* Password Change Modal */}
            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
            />
        </aside>
    );
}
