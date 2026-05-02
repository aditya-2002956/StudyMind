import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AITutorDrawer } from "@/components/AITutorDrawer";
import { ClientLayout } from "@/components/ClientLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyMind | Antigravity",
  description: "AI-Powered Study Assistant with an Antigravity vibe",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-deepSpace flex relative overflow-x-hidden">
          <ClientLayout>{children}</ClientLayout>
        </div>
      </body>
    </html>
  );
}
