"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { BrainCircuit, Book, ShieldAlert, Sparkles, Compass, Play, ExternalLink, Search } from "lucide-react";

type OnboardingResult = {
  profile?: { name?: string };
  recommended_domains?: Array<{ name: string; confidence: number; reason: string; source?: string }>;
  suggested_next_subjects?: string[];
  notebook_needs?: string[];
  study_material_needs?: string[];
  starter_material_sources?: Array<{ title: string; url: string; notes?: string; provider?: string; source_type?: string; relevance?: number }>;
};

type MaterialsResult = {
  results?: Array<{ title: string; url: string; notes?: string; provider?: string; source_type?: string; relevance?: number }>;
  search_queries?: string[];
  note?: string;
};

export default function OnboardingOverview() {
  const router = useRouter();
  const [profile, setProfile] = useState<OnboardingResult | null>(null);
  const [materials, setMaterials] = useState<MaterialsResult | null>(null);

  useEffect(() => {
    const savedProfile = localStorage.getItem("studymind:onboarding");
    const savedMaterials = localStorage.getItem("studymind:materials");
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
  }, []);

  const domains = profile?.recommended_domains || ["VTU B.E. CSE Core", "CBSE/NCERT Syllabus Mapping"].map((name) => ({
    name,
    confidence: 0.75,
    reason: "Starter academic map loaded.",
    source: "StudyMind starter",
  }));
  const subjects = profile?.suggested_next_subjects || ["Data Structures", "Mathematics", "Science"];
  const sourceCards = materials?.results || profile?.starter_material_sources || [];

  return (
    <main className="min-h-screen bg-deepSpace flex flex-col relative overflow-hidden">
      <div className="absolute top-[10%] left-[20%] w-[60%] h-[60%] bg-electricViolet/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="flex-1 p-6 md:p-12 z-10 max-w-6xl mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center mt-10">
          <div className="inline-flex items-center justify-center p-3 bg-neonCyan/10 rounded-2xl mb-6 shadow-[0_0_20px_rgba(0,209,255,0.2)]">
            <BrainCircuit className="w-8 h-8 text-neonCyan" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Profile Initialized
          </h1>
          <p className="text-xl text-white/60">
            Welcome to StudyMind{profile?.profile?.name ? `, ${profile.profile.name}` : ""}. Your Indian academic map is ready.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-3xl border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <Compass className="w-6 h-6 text-neonCyan" />
              <h2 className="text-xl font-bold text-white">Recommended Domains</h2>
            </div>
            <ul className="space-y-4">
              {domains.map((domain, i) => (
                <li key={i} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-white/90 font-medium">{domain.name}</span>
                    <span className="text-xs text-neonCyan">{Math.round(domain.confidence * 100)}%</span>
                  </div>
                  <p className="text-xs text-white/40">{domain.source}</p>
                  <p className="text-sm text-white/50 mt-2">{domain.reason}</p>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel p-8 rounded-3xl border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <ShieldAlert className="w-6 h-6 text-electricViolet" />
              <h2 className="text-xl font-bold text-white">Suggested Focus</h2>
            </div>
            <div className="flex flex-wrap gap-2 mb-8">
              {subjects.map((subject, i) => (
                <span key={i} className="px-4 py-2 bg-electricViolet/20 border border-electricViolet/50 rounded-xl font-medium text-white">
                  {subject}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <Book className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">Loadout Status</h2>
            </div>
            <div className="space-y-3">
              {(profile?.notebook_needs || ["Weekly revision notebook"]).slice(0, 3).map((need) => (
                <div key={need} className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                  <span className="text-white/70">{need}</span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">QUEUED</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-3xl border-white/10 mb-10">
          <div className="flex items-center gap-3 mb-6">
            <Search className="w-6 h-6 text-neonCyan" />
            <h2 className="text-xl font-bold text-white">Syllabus & Study Material Sources</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sourceCards.map((source, i) => (
              <a key={`${source.url}-${i}`} href={source.url} target="_blank" rel="noreferrer" className="block bg-white/5 p-5 rounded-2xl border border-white/10 hover:border-neonCyan/40 transition-all group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-white font-semibold group-hover:text-neonCyan transition-colors">{source.title}</h3>
                  <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-neonCyan" />
                </div>
                <p className="text-sm text-white/50">{source.notes}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-white/30">
                  <span>{source.provider || source.source_type || "Source"}</span>
                  {source.relevance ? <span>{Math.round(source.relevance * 100)}% match</span> : null}
                </div>
              </a>
            ))}
          </div>
          {materials?.search_queries?.length ? (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/70 mb-3">Internet pull queries</h3>
              <div className="flex flex-wrap gap-2">
                {materials.search_queries.map((query) => (
                  <span key={query} className="px-3 py-2 rounded-full bg-neonCyan/10 border border-neonCyan/20 text-neonCyan text-xs">
                    {query}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
          <button onClick={() => router.push("/quizzes")} className="group relative overflow-hidden flex items-center gap-3 px-10 py-5 bg-white text-deepSpace rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            <div className="absolute inset-0 bg-gradient-to-r from-neonCyan to-electricViolet opacity-0 group-hover:opacity-20 transition-opacity" />
            <Sparkles className="w-6 h-6" />
            Take Diagnostic Quiz
            <Play className="w-5 h-5 ml-2" fill="currentColor" />
          </button>
        </motion.div>
      </div>
    </main>
  );
}
