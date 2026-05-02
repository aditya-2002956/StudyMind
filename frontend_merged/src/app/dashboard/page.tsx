"use client";

import { TopBar } from "@/components/TopBar";
import { WeaknessRadar } from "@/components/WeaknessRadar";
import { Badges } from "@/components/Badges";
import { DailyAgenda } from "@/components/DailyAgenda";
import { FocusMode } from "@/components/FocusMode";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [canShowDashboard, setCanShowDashboard] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const hasSession = Boolean(localStorage.getItem("studymind:access_token"));
    const isDemo = localStorage.getItem("studymind:mode") === "demo";

    if (!hasSession && !isDemo) {
      router.replace("/login");
      return;
    }

    setCanShowDashboard(true);
  }, [router]);

  if (!canShowDashboard) {
    return (
      <main className="min-h-screen bg-deepSpace flex items-center justify-center text-white/60">
        Opening StudyMind...
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-electricViolet/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-neonCyan/20 blur-[120px] rounded-full pointer-events-none" />

      <TopBar />
      <FocusMode isOpen={isFocusModeOpen} onClose={() => setIsFocusModeOpen(false)} />

      <div className="flex-1 p-6 z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto space-y-6"
        >
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                Dashboard
              </h1>
              <p className="text-white/50 mt-2">Welcome back to your Nerve Center.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/weak-topics")}
                className="px-6 py-2 rounded-full bg-red-400/10 hover:bg-red-400/20 border border-red-400/30 text-red-300 font-medium transition-all duration-300 flex items-center gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Weak Topics
              </button>
              <button
                onClick={() => setIsFocusModeOpen(true)}
                className="px-6 py-2 rounded-full bg-electricViolet/20 hover:bg-electricViolet/30 border border-electricViolet/50 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center gap-2"
              >
                <div className="w-2 h-2 rounded-full bg-electricViolet animate-pulse" />
                Enter Focus Mode
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <DailyAgenda />
              <Badges />
            </div>

            <div className="lg:col-span-1">
              <WeaknessRadar />
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
