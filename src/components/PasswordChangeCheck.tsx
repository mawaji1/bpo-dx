'use client';

import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PasswordChangeCheck({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // Skip if loading, not authenticated, or already on change-password page
        if (status === 'loading' || !session?.user?.id || pathname === '/change-password') {
            return;
        }

        // Check if user must change password
        async function checkPasswordChange() {
            try {
                const res = await fetch(`/api/users/check-password-change?userId=${session?.user?.id}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.mustChangePassword) {
                        router.push('/change-password');
                    }
                }
            } catch (error) {
                console.error('Error checking password change:', error);
            }
        }

        checkPasswordChange();
    }, [session, status, pathname, router]);

    return <>{children}</>;
}
