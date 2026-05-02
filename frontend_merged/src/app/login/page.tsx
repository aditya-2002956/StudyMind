"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, ArrowRight, Loader2 } from "lucide-react";
import { saveAuthSession, signInWithEmail, signUpWithEmail } from "@/lib/auth";

function onboardingCompleteKey(userId: string | null) {
  return userId ? `studymind:onboarding_complete:${userId}` : "studymind:onboarding_complete";
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAuth = async () => {
    setError("");
    setStatus("");

    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password with at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = mode === "signup"
        ? await signUpWithEmail(email.trim(), password)
        : await signInWithEmail(email.trim(), password);

      saveAuthSession(result);
      localStorage.setItem("studymind:mode", "signup");
      const userId = result.user?.id || localStorage.getItem("studymind:user_id");

      if (mode === "signup" && !result.access_token) {
        localStorage.removeItem(onboardingCompleteKey(userId));
        setStatus("Account created. If Supabase asks for email confirmation, verify your email, then log in here.");
        setMode("login");
      } else {
        if (mode === "signup") {
          localStorage.removeItem(onboardingCompleteKey(userId));
          localStorage.removeItem("studymind:onboarding");
          localStorage.removeItem("studymind:materials");
          router.push("/onboarding");
          return;
        }

        const hasCompletedOnboarding = localStorage.getItem(onboardingCompleteKey(userId)) === "true";
        router.push(hasCompletedOnboarding ? "/dashboard" : "/onboarding");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed.";
      if (message.toLowerCase().includes("rate limit")) {
        setError("Supabase email rate limit exceeded. If you already created this account, switch to Log In. Otherwise wait a few minutes before trying Sign Up again.");
      } else {
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl bg-white/5 p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${mode === "signup" ? "bg-white text-deepSpace" : "text-white/50 hover:text-white"}`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => setMode("login")}
                className={`rounded-lg py-2 text-sm font-semibold transition-all ${mode === "login" ? "bg-white text-deepSpace" : "text-white/50 hover:text-white"}`}
              >
                Log In
              </button>
            </div>

            <div className="space-y-4 pt-1">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-neonCyan"
              />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                className="w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-white outline-none focus:border-neonCyan"
              />
              <button
                onClick={handleAuth}
                disabled={isSubmitting}
                className="w-full relative overflow-hidden group rounded-xl bg-white/10 border border-white/20 py-3 text-white font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,209,255,0.3)]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neonCyan/20 to-electricViolet/20 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-in-out" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {mode === "signup" ? "Create StudyMind Account" : "Log In"}
                  {!isSubmitting ? <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /> : null}
                </span>
              </button>

              <button
                onClick={() => {
                  localStorage.setItem("studymind:mode", "demo");
                  localStorage.setItem("studymind:user_id", "demo-user");
                  router.push("/dashboard");
                }}
                className="w-full relative overflow-hidden group rounded-xl bg-transparent border border-white/10 py-3 text-white/70 font-medium transition-all duration-300 hover:bg-white/5 hover:text-white"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Continue as Demo Student
                </span>
              </button>
              {error ? <p className="text-sm font-semibold text-red-300">{error}</p> : null}
              {status ? <p className="text-sm font-semibold text-emerald-300">{status}</p> : null}
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
