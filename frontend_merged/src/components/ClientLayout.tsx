"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AITutorDrawer } from "@/components/AITutorDrawer";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthOrOnboarding = pathname === "/login" || pathname?.startsWith("/onboarding");

  if (isAuthOrOnboarding) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="min-w-0 w-full flex-1 flex flex-col relative lg:ml-72">
        {children}
        <AITutorDrawer />
      </div>
    </>
  );
}
