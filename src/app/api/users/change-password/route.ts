import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const { userId, currentPassword, newPassword } = await request.json();

        if (!userId || !currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'جميع الحقول مطلوبة' },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' },
                { status: 400 }
            );
        }

        const user = await getUserById(userId);

        if (!user) {
            return NextResponse.json(
                { error: 'المستخدم غير موجود' },
                { status: 404 }
            );
        }

        // Verify current password
        if (user.password !== currentPassword) {
            return NextResponse.json(
                { error: 'كلمة المرور الحالية غير صحيحة' },
                { status: 401 }
            );
        }

        // Update password and clear mustChangePassword flag
        await updateUser(userId, {
            password: newPassword,
            mustChangePassword: false
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في تغيير كلمة المرور' },
            { status: 500 }
        );
    }
}
