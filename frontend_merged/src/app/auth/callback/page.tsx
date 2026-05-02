"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Loader2 } from "lucide-react";
import { fetchAuthUser } from "@/lib/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const finishVerification = async () => {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const queryParams = new URLSearchParams(window.location.search);
        const error = hashParams.get("error_description") || queryParams.get("error_description");

        if (error) {
          setMessage(error);
          return;
        }

        const accessToken = hashParams.get("access_token");
        if (!accessToken) {
          setMessage("Email link opened, but no login session was returned. Try logging in now with your email and password.");
          setTimeout(() => router.replace("/login"), 2200);
          return;
        }

        localStorage.setItem("studymind:access_token", accessToken);
        localStorage.setItem("studymind:mode", "signup");

        const user = await fetchAuthUser(accessToken);
        if (user.id) localStorage.setItem("studymind:user_id", user.id);
        if (user.email) {
          localStorage.setItem("studymind:email", user.email);
          localStorage.removeItem("studymind:pending_email");
        }

        setMessage("Email verified. Opening your onboarding survey...");
        setTimeout(() => router.replace("/onboarding"), 800);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Could not finish email verification.");
      }
    };

    finishVerification();
  }, [router]);

  return (
    <main className="min-h-screen bg-deepSpace flex items-center justify-center p-6">
      <div className="glass-panel rounded-3xl border border-white/10 p-10 max-w-md text-center">
        <div className="mx-auto mb-6 w-16 h-16 rounded-2xl bg-neonCyan/10 border border-neonCyan/30 flex items-center justify-center">
          <BrainCircuit className="w-8 h-8 text-neonCyan" />
        </div>
        <div className="flex items-center justify-center gap-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin text-neonCyan" />
          <p className="font-semibold">{message}</p>
        </div>
      </div>
    </main>
  );
}
