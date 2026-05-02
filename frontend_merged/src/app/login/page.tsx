"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrainCircuit, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-deepSpace flex items-center justify-center relative overflow-hidden p-6">
      {/* Background ambient light */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-electricViolet/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-neonCyan/20 blur-[150px] rounded-full pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              opacity: Math.random() * 0.5 + 0.1,
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              x: [null, Math.random() * 100 - 50],
              opacity: [null, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-1 h-1 bg-neonCyan rounded-full shadow-[0_0_10px_rgba(0,209,255,0.8)]"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden group">
          {/* Subtle hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-neonCyan/5 to-electricViolet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <div className="relative z-10">
            <div className="flex flex-col items-center mb-10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5 shadow-[0_0_30px_rgba(139,92,246,0.3)] mb-6"
              >
                <BrainCircuit className="w-8 h-8 text-electricViolet" />
              </motion.div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                StudyMind
              </h1>
              <p className="text-white/40 text-sm mt-2">Enter your nerve center</p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => {
                  localStorage.setItem("studymind:mode", "signup");
                  localStorage.removeItem("studymind:progress");
                  localStorage.removeItem("studymind:onboarding");
                  localStorage.removeItem("studymind:materials");
                  router.push("/onboarding");
                }}
                className="w-full relative overflow-hidden group rounded-xl bg-white/10 border border-white/20 py-3 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,209,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neonCyan/20 to-electricViolet/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Sign Up
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("studymind:mode", "demo");
                  router.push("/onboarding");
                }}
                className="w-full relative overflow-hidden group rounded-xl bg-transparent border border-white/10 py-3 text-white/70 font-medium transition-all duration-300 hover:bg-white/5 hover:text-white"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue as Demo Student
                </span>
              </button>
            </div>
            
            <div className="mt-8 text-center flex flex-col gap-2">
              <a href="#" className="text-xs text-white/40 hover:text-neonCyan transition-colors">
                Already have an account? Log in
              </a>
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
