import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers } from '@/lib/server-data';

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

        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return NextResponse.json(
                { error: 'المستخدم غير موجود' },
                { status: 404 }
            );
        }

        // Verify current password
        if (users[userIndex].password !== currentPassword) {
            return NextResponse.json(
                { error: 'كلمة المرور الحالية غير صحيحة' },
                { status: 401 }
            );
        }

        // Update password and clear mustChangePassword flag
        users[userIndex].password = newPassword;
        users[userIndex].mustChangePassword = false;

        saveUsers(users);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error changing password:', error);
        return NextResponse.json(
            { error: 'حدث خطأ في تغيير كلمة المرور' },
            { status: 500 }
        );
    }
}
