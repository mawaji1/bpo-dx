import NextAuth from "next-auth";

declare module "next-auth" {
    interface User {
        id: string;
        role?: string;
        department?: string | null;
        mustChangePassword?: boolean;
    }

    interface Session {
        user: {
            id: string;
            name?: string | null;
            email?: string | null;
            role?: string;
            department?: string | null;
            mustChangePassword?: boolean;
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        department?: string | null;
        mustChangePassword?: boolean;
    }
}

