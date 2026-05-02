"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Settings, User, Database, RotateCcw, LogOut, ClipboardCheck, Wifi } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

function onboardingCompleteKey(userId: string | null) {
  return userId ? `studymind:onboarding_complete:${userId}` : "studymind:onboarding_complete";
}

export default function SettingsPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [mode, setMode] = useState("");
  const [apiStatus, setApiStatus] = useState("Checking...");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setEmail(localStorage.getItem("studymind:email") || "Not signed in");
    setUserId(localStorage.getItem("studymind:user_id") || "Not set");
    setMode(localStorage.getItem("studymind:mode") || "real user");

    fetch(`${API_BASE_URL}/health`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then((data) => setApiStatus(`${data.status || "ok"} - ${data.service || "StudyMind API"}`))
      .catch(() => setApiStatus("Backend not reachable"));
  }, []);

  const resetOnboarding = () => {
    const savedUserId = localStorage.getItem("studymind:user_id");
    localStorage.removeItem(onboardingCompleteKey(savedUserId));
    localStorage.removeItem("studymind:onboarding");
    localStorage.removeItem("studymind:materials");
    router.push("/onboarding");
  };

  const clearStudyData = () => {
    localStorage.removeItem("studymind:progress");
    localStorage.removeItem("studymind:onboarding");
    localStorage.removeItem("studymind:materials");
    setNotice("Local study progress cleared for this browser.");
  };

  const logout = () => {
    localStorage.removeItem("studymind:access_token");
    localStorage.removeItem("studymind:email");
    localStorage.removeItem("studymind:mode");
    router.push("/login");
  };

  return (
    <main className="flex-1 min-h-screen bg-deepSpace relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[45%] h-[45%] bg-neonCyan/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] bg-electricViolet/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto p-6 md:p-10 space-y-8">
        <header>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-neonCyan" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">Settings</h1>
              <p className="text-white/50 mt-1">Manage account, onboarding, and local demo data.</p>
            </div>
          </div>
        </header>

        {notice ? (
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-emerald-200">
            {notice}
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-neonCyan" />
              <h2 className="text-xl font-bold text-white">Account</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 mb-1">Email</p>
                <p className="text-white break-all">{email}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 mb-1">User ID</p>
                <p className="text-white break-all">{userId}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 mb-1">Mode</p>
                <p className="text-white">{mode}</p>
              </div>
            </div>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel rounded-3xl border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <Wifi className="w-5 h-5 text-emerald-300" />
              <h2 className="text-xl font-bold text-white">System</h2>
            </div>
            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 mb-1">Backend</p>
                <p className="text-white">{apiStatus}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <p className="text-white/40 mb-1">API Base URL</p>
                <p className="text-white break-all">{API_BASE_URL}</p>
              </div>
            </div>
          </motion.section>
        </div>

        <section className="glass-panel rounded-3xl border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-electricViolet" />
            <h2 className="text-xl font-bold text-white">Study Data</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={resetOnboarding} className="rounded-2xl border border-neonCyan/30 bg-neonCyan/10 p-5 text-left hover:bg-neonCyan/20 transition-colors">
              <ClipboardCheck className="w-5 h-5 text-neonCyan mb-3" />
              <p className="font-bold text-white">Retake Onboarding</p>
              <p className="text-sm text-white/50 mt-1">Redo the academic survey.</p>
            </button>
            <button onClick={clearStudyData} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 transition-colors">
              <RotateCcw className="w-5 h-5 text-white/70 mb-3" />
              <p className="font-bold text-white">Clear Local Progress</p>
              <p className="text-sm text-white/50 mt-1">Reset this browser's quiz and weak-topic data.</p>
            </button>
            <button onClick={logout} className="rounded-2xl border border-red-400/30 bg-red-400/10 p-5 text-left hover:bg-red-400/20 transition-colors">
              <LogOut className="w-5 h-5 text-red-300 mb-3" />
              <p className="font-bold text-white">Log Out</p>
              <p className="text-sm text-white/50 mt-1">Return to the login screen.</p>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
