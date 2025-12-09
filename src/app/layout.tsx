import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import PasswordChangeCheck from "@/components/PasswordChangeCheck";

const arabicFont = IBM_Plex_Sans_Arabic({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["arabic"],
  variable: "--font-arabic",
});

export const metadata: Metadata = {
  title: "مقياس نضج التحول الرقمي",
  description: "منصة تقييم نضج التحول الرقمي لمشاريع قطاع إسناد الأعمال",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${arabicFont.variable} font-arabic antialiased bg-slate-50`}>
        <Providers>
          <PasswordChangeCheck>
            {children}
          </PasswordChangeCheck>
        </Providers>
      </body>
    </html>
  );
}
