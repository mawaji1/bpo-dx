'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ChangePasswordPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('كلمتا المرور غير متطابقتين');
            return;
        }

        if (newPassword.length < 6) {
            setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: session?.user?.id,
                    currentPassword,
                    newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'حدث خطأ أثناء تغيير كلمة المرور');
                return;
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/evaluator');
            }, 2000);
        } catch (err) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setLoading(false);
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">تم تغيير كلمة المرور</h2>
                    <p className="text-slate-600">جاري تحويلك...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">تغيير كلمة المرور</h1>
                    <p className="text-slate-600 mt-2">يرجى تغيير كلمة المرور للمتابعة</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            كلمة المرور الحالية
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            كلمة المرور الجديدة
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            تأكيد كلمة المرور الجديدة
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                جاري التغيير...
                            </>
                        ) : (
                            'تغيير كلمة المرور'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
