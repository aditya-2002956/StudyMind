"use client";

import { motion } from "framer-motion";
import { TopBar } from "@/components/TopBar";
import { BookOpen, Calendar as CalendarIcon, Clock, ExternalLink, RefreshCcw, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Task = {
  time: string;
  title: string;
  duration: string;
  type: "Core" | "Practice" | "Assessment" | "Assignment";
  completed?: boolean;
  sourceTitle?: string;
  sourceUrl?: string;
};

type DayPlan = {
  day: string;
  tasks: Task[];
};

type MaterialSource = {
  title: string;
  url: string;
  notes?: string;
  provider?: string;
  source_type?: string;
  relevance?: number;
};

type OnboardingResult = {
  suggested_next_subjects?: string[];
  study_material_needs?: string[];
  starter_material_sources?: MaterialSource[];
  profile?: {
    subjects?: Array<{ subject: string }>;
  };
};

type MaterialsResult = {
  results?: MaterialSource[];
  search_queries?: string[];
  note?: string;
};

const demoSchedule: DayPlan[] = [
  {
    day: "Monday",
    tasks: [
      { time: "09:00 AM", title: "Physics: Thermodynamics Review", duration: "2h", type: "Core", completed: true },
      { time: "02:00 PM", title: "Math: Calculus Problem Set", duration: "1.5h", type: "Practice" },
    ],
  },
  {
    day: "Tuesday",
    tasks: [
      { time: "10:00 AM", title: "Chemistry: Organic Mechanisms", duration: "2h", type: "Core" },
      { time: "03:00 PM", title: "Diagnostic Quiz", duration: "45m", type: "Assessment" },
    ],
  },
  {
    day: "Wednesday",
    tasks: [
      { time: "09:00 AM", title: "Physics: Electromagnetism", duration: "2h", type: "Core" },
      { time: "01:00 PM", title: "Literature: Essay Draft", duration: "1.5h", type: "Assignment" },
    ],
  },
];

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function dedupeSources(sources: MaterialSource[]) {
  const seen = new Set<string>();
  return sources.filter((source) => {
    const key = source.url || source.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRealSchedule(profile: OnboardingResult | null, materials: MaterialsResult | null): DayPlan[] {
  const subjects = [
    ...(profile?.suggested_next_subjects || []),
    ...((profile?.profile?.subjects || []).map((item) => item.subject)),
  ].filter(Boolean);
  const uniqueSubjects = Array.from(new Set(subjects)).slice(0, 6);
  const sources = dedupeSources([...(materials?.results || []), ...(profile?.starter_material_sources || [])]);

  if (!uniqueSubjects.length) return [];

  return days.slice(0, Math.min(3, uniqueSubjects.length || 3)).map((day, index) => {
    const subject = uniqueSubjects[index % uniqueSubjects.length];
    const source = sources[index % Math.max(1, sources.length)];
    const practiceSource = sources[(index + 1) % Math.max(1, sources.length)];

    return {
      day,
      tasks: [
        {
          time: index % 2 === 0 ? "09:00 AM" : "10:00 AM",
          title: `${subject}: syllabus modules and notes`,
          duration: "1.5h",
          type: "Core",
          sourceTitle: source?.provider ? `${source.provider}: ${source.title}` : source?.title,
          sourceUrl: source?.url,
        },
        {
          time: index % 2 === 0 ? "02:00 PM" : "03:00 PM",
          title: `${subject}: practice questions and recall`,
          duration: "45m",
          type: index === 1 ? "Assessment" : "Practice",
          sourceTitle: practiceSource?.provider ? `${practiceSource.provider}: ${practiceSource.title}` : practiceSource?.title,
          sourceUrl: practiceSource?.url,
        },
      ],
    };
  });
}

export default function PlannerPage() {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [mode, setMode] = useState<"demo" | "signup">("signup");
  const [profile, setProfile] = useState<OnboardingResult | null>(null);
  const [materials, setMaterials] = useState<MaterialsResult | null>(null);

  useEffect(() => {
    setMode(localStorage.getItem("studymind:mode") === "demo" ? "demo" : "signup");

    const savedProfile = localStorage.getItem("studymind:onboarding");
    const savedMaterials = localStorage.getItem("studymind:materials");
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    if (savedMaterials) setMaterials(JSON.parse(savedMaterials));
  }, []);

  const schedule = useMemo(() => {
    if (mode === "demo") return demoSchedule;
    return buildRealSchedule(profile, materials);
  }, [materials, mode, profile]);

  const sourceCards = useMemo(() => {
    if (mode === "demo") return [];
    return dedupeSources([...(materials?.results || []), ...(profile?.starter_material_sources || [])]).slice(0, 6);
  }, [materials, mode, profile]);

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => setIsRegenerating(false), 900);
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case "Core": return "border-electricViolet text-electricViolet bg-electricViolet/10";
      case "Practice": return "border-neonCyan text-neonCyan bg-neonCyan/10";
      case "Assessment": return "border-red-400 text-red-400 bg-red-400/10";
      default: return "border-emerald-400 text-emerald-400 bg-emerald-400/10";
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden min-h-screen bg-deepSpace">
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[50%] bg-electricViolet/10 blur-[150px] rounded-full pointer-events-none" />

      <TopBar />

      <div className="flex-1 p-6 z-10 max-w-6xl mx-auto w-full flex flex-col">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight flex items-center gap-3">
              <CalendarIcon className="w-8 h-8 text-electricViolet" />
              Autonomous Planner
            </h1>
            <p className="text-white/50 mt-2 max-w-xl">
              {mode === "demo"
                ? "Demo schedule using sample academic tasks."
                : "Your study blocks are generated from onboarding subjects and fetched syllabus or notes sources."}
            </p>
          </div>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:border-electricViolet/50 text-white font-medium transition-all duration-300 flex items-center gap-2 group"
          >
            <RefreshCcw className={`w-4 h-4 ${isRegenerating ? "animate-spin text-electricViolet" : "group-hover:text-electricViolet transition-colors"}`} />
            {isRegenerating ? "Re-optimizing..." : "Regenerate Schedule"}
          </button>
        </header>

        {schedule.length === 0 ? (
          <div className="glass-panel p-8 rounded-3xl border-white/10 text-center">
            <BookOpen className="w-10 h-10 text-neonCyan mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No real profile loaded yet</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              Complete onboarding once, and this page will build your plan from CBSE/NCERT, VTU, VTUCircle, and other selected source cards instead of demo subjects.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {schedule.map((dayPlan, i) => (
              <motion.div
                key={dayPlan.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-panel p-6 rounded-3xl border-white/10 flex flex-col"
              >
                <h2 className="text-xl font-bold text-white mb-6 pb-4 border-b border-white/10 flex items-center justify-between">
                  {dayPlan.day}
                  <span className="text-xs font-normal text-white/40 bg-white/5 px-2 py-1 rounded-md">{dayPlan.tasks.length} Blocks</span>
                </h2>

                <div className="space-y-4 flex-1">
                  {dayPlan.tasks.map((task, j) => (
                    <motion.div
                      key={`${task.title}-${j}`}
                      whileHover={{ scale: 1.02 }}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden group ${task.completed ? "opacity-50 border-white/5 bg-white/5" : getTaskColor(task.type)}`}
                    >
                      {task.completed && (
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white font-bold bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-md">Completed</span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2 relative z-0">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-80">{task.type}</span>
                        <div className="flex items-center gap-1 text-xs opacity-70">
                          <Clock className="w-3 h-3" />
                          {task.time} ({task.duration})
                        </div>
                      </div>
                      <h3 className="font-semibold text-sm relative z-0">{task.title}</h3>
                      {task.sourceUrl && (
                        <a
                          href={task.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex max-w-full items-center gap-1 text-xs text-white/60 hover:text-white"
                        >
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          <span className="truncate">{task.sourceTitle || "Open source"}</span>
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>

                <button className="w-full mt-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Add Custom Block
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {sourceCards.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-white mb-4">Fetched Material Sources</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sourceCards.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="glass-panel p-5 rounded-2xl border-white/10 hover:border-neonCyan/40 transition-all"
                >
                  <p className="text-xs uppercase tracking-wider text-neonCyan mb-2">{source.provider || source.source_type || "Source"}</p>
                  <h3 className="text-white font-semibold line-clamp-2">{source.title}</h3>
                  {source.notes && <p className="text-white/45 text-sm mt-2 line-clamp-3">{source.notes}</p>}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
