import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Ứng dụng quản lý chi tiêu cá nhân",
  description:
    "Một ứng dụng Next.js giúp theo dõi và quản lý thu chi cá nhân. Xây dựng bằng TypeScript, Tailwind CSS, và shadcn/ui.",
  keywords: ["Quản lý chi tiêu", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
  authors: [{ name: "Nguyễn Việt Hưng" }],
  openGraph: {
    title: "Ứng dụng quản lý chi tiêu cá nhân",
    description: "Theo dõi và quản lý thu chi dễ dàng",
    url: "http://localhost:3000", 
    siteName: "Quản lý chi tiêu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ứng dụng quản lý chi tiêu cá nhân",
    description: "Theo dõi và quản lý thu chi dễ dàng",
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
