"use client";

import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Target } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/store/useStore";

const DEMO_DATA = [
  { subject: "Algorithms", score: 85, fullMark: 100 },
  { subject: "System Design", score: 60, fullMark: 100 },
  { subject: "Data Structures", score: 90, fullMark: 100 },
  { subject: "Databases", score: 75, fullMark: 100 },
  { subject: "Networking", score: 65, fullMark: 100 },
  { subject: "OS", score: 70, fullMark: 100 },
];

const DEMO_WEAKNESSES = [
  { topic: "System Design", accuracy: 60, note: "Review component tradeoffs and scaling patterns." },
  { topic: "Networking", accuracy: 65, note: "Revise protocols, routing, and packet flow." },
  { topic: "OS", accuracy: 70, note: "Practice scheduling, memory, and synchronization." },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-xl border-neonCyan/30 text-sm">
        <p className="text-white font-medium">{payload[0].payload.subject}</p>
        <p className="text-neonCyan">Accuracy: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export function WeaknessRadar() {
  const [isDemo, setIsDemo] = useState(false);
  const { quizTopicStats } = useStore();

  useEffect(() => {
    setIsDemo(localStorage.getItem("studymind:mode") === "demo");
  }, []);

  const realData = useMemo(() => {
    return quizTopicStats.slice(-8).map((item) => ({
      subject: item.topic,
      score: item.attempted ? Math.round((item.correct / item.attempted) * 100) : 0,
      fullMark: 100,
      attempted: item.attempted,
      correct: item.correct,
    }));
  }, [quizTopicStats]);

  const data = isDemo ? DEMO_DATA : realData;
  const weaknesses = isDemo
    ? DEMO_WEAKNESSES
    : realData
        .filter((item) => item.score < 75)
        .sort((a, b) => a.score - b.score)
        .map((item) => ({
          topic: item.subject,
          accuracy: item.score,
          note: `${item.correct}/${item.attempted} correct from your uploaded-PDF quiz.`,
        }));

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-5 sm:p-6 rounded-3xl w-full min-h-[460px] flex flex-col relative overflow-hidden group"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-neonCyan/10 rounded-full blur-3xl group-hover:bg-neonCyan/20 transition-colors duration-700" />

      <div className="flex items-center gap-3 mb-5 z-10">
        <div className="p-2 bg-neonCyan/10 rounded-lg">
          <Target className="w-5 h-5 text-neonCyan" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white tracking-wider">Skill Radar</h3>
          <p className="text-xs text-white/40">
            {isDemo ? "Demo defaults" : "From your latest quiz attempts"}
          </p>
        </div>
      </div>

      {data.length > 0 ? (
        <>
          <div className="w-full h-64 z-10">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Radar
                  name="Student"
                  dataKey="score"
                  stroke="#00D1FF"
                  strokeWidth={2}
                  fill="#00D1FF"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="z-10 mt-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/50">Weak Topics</h4>
            {weaknesses.length > 0 ? (
              weaknesses.slice(0, 4).map((item) => (
                <div key={item.topic} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-white">{item.topic}</p>
                    <span className="text-sm text-neonCyan">{item.accuracy}%</span>
                  </div>
                  <p className="mt-1 text-xs text-white/45">{item.note}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                No weak topics yet from this quiz. Nice, but take a harder quiz before trusting that too much.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="z-10 flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-white font-semibold">No quiz data yet</p>
          <p className="mt-2 text-sm text-white/45">
            Upload a PDF and answer the quiz. This radar will then show Maths/PDF topics instead of demo OS or Algorithms.
          </p>
        </div>
      )}
    </motion.div>
  );
}
