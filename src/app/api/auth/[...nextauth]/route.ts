import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, getUserById } from "@/lib/db";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "البريد الإلكتروني", type: "email" },
                password: { label: "كلمة المرور", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await getUserByEmail(credentials.email);

                if (user && user.password === credentials.password) {
                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        department: user.department,
                        mustChangePassword: user.mustChangePassword || false,
                    };
                }

                return null;
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.department = user.department;
                token.mustChangePassword = user.mustChangePassword;
            }

            // Always check the latest mustChangePassword value from database
            if (token.sub) {
                const currentUser = await getUserById(token.sub);
                if (currentUser) {
                    token.mustChangePassword = currentUser.mustChangePassword || false;
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string;
                session.user.role = token.role as string;
                session.user.department = token.department as string;
                session.user.mustChangePassword = token.mustChangePassword as boolean;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET || "dx-assessment-secret-key-change-in-production",
});

export { handler as GET, handler as POST };
