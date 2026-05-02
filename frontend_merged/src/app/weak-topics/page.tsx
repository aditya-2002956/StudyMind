"use client";

import { TopBar } from "@/components/TopBar";
import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { AlertTriangle, BrainCircuit, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WeakTopicsPage() {
  const { quizTopicStats } = useStore();
  const router = useRouter();

  const topics = quizTopicStats
    .map((topic) => ({
      ...topic,
      accuracy: topic.attempted ? Math.round((topic.correct / topic.attempted) * 100) : 0,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakTopics = topics.filter((topic) => topic.accuracy < 75);

  return (
    <main className="flex-1 flex flex-col relative overflow-x-hidden min-h-screen bg-deepSpace">
      <div className="absolute top-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-red-400/10 blur-[120px] pointer-events-none" />
      <TopBar />

      <div className="flex-1 p-4 sm:p-6 z-10 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto space-y-6"
        >
          <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                Weak Topics
              </h1>
              <p className="text-white/50 mt-2">
                Based on your quiz accuracy, not random demo labels.
              </p>
            </div>
            <button
              onClick={() => router.push("/quizzes")}
              className="w-fit px-6 py-3 rounded-full bg-neonCyan/20 border border-neonCyan/50 text-neonCyan font-semibold hover:bg-neonCyan/30 transition-all"
            >
              Take Another Quiz
            </button>
          </header>

          {topics.length === 0 ? (
            <div className="glass-panel rounded-3xl p-8 text-center">
              <BrainCircuit className="mx-auto mb-4 h-10 w-10 text-neonCyan" />
              <h2 className="text-2xl font-bold text-white">No quiz data yet</h2>
              <p className="mx-auto mt-2 max-w-xl text-white/50">
                Upload a PDF and finish a quiz. Your weak topics will appear here with accuracy and revision guidance.
              </p>
            </div>
          ) : weakTopics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((topic) => (
                <div key={`${topic.subject}-${topic.topic}`} className="glass-panel rounded-2xl p-5 border-red-400/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-red-300">{topic.subject}</p>
                      <h2 className="mt-1 text-xl font-bold text-white">{topic.topic}</h2>
                    </div>
                    <div className="rounded-xl bg-red-400/10 px-3 py-2 text-red-300 font-bold">
                      {topic.accuracy}%
                    </div>
                  </div>
                  <p className="mt-4 text-white/55">
                    You got {topic.correct}/{topic.attempted} correct. Revise this topic, ask the Socratic tutor for hints, then retake a PDF quiz.
                  </p>
                  <button
                    onClick={() => router.push(`/chat`)}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <AlertTriangle className="h-4 w-4 text-red-300" />
                    Ask Tutor
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel rounded-3xl p-8 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-300" />
              <h2 className="text-2xl font-bold text-white">No weak topics under 75%</h2>
              <p className="mx-auto mt-2 max-w-xl text-white/50">
                Your current quiz attempts look good. Try a harder PDF quiz or more questions to get a sharper diagnosis.
              </p>
            </div>
          )}

          {topics.length > 0 && (
            <section className="glass-panel rounded-3xl p-5 sm:p-6">
              <h2 className="text-lg font-bold text-white mb-4">All Topic Accuracy</h2>
              <div className="space-y-3">
                {topics.map((topic) => (
                  <div key={`${topic.subject}-${topic.topic}-row`}>
                    <div className="mb-1 flex items-center justify-between gap-4 text-sm">
                      <span className="text-white/75">{topic.topic}</span>
                      <span className="text-white/45">{topic.correct}/{topic.attempted} correct</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className={`h-full rounded-full ${topic.accuracy < 75 ? "bg-red-400" : "bg-neonCyan"}`}
                        style={{ width: `${topic.accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </div>
    </main>
  );
}
