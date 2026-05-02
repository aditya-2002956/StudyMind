"use client";

import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Flame, Trophy } from "lucide-react";

export function TopBar() {
  const { xp, level, studyStreak } = useStore();
  const xpForNextLevel = level * 100;
  const xpProgress = (xp % 100) / 100;

  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-panel sticky top-0 z-50 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 m-3 sm:m-4 rounded-2xl"
    >
      <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto">
        <div className="flex shrink-0 items-center justify-center w-12 h-12 rounded-full bg-neonCyan/20 border border-neonCyan/50 shadow-[0_0_15px_rgba(0,209,255,0.3)]">
          <Trophy className="text-neonCyan w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white tracking-wide">Level {level}</h2>
          <div className="w-28 sm:w-32 h-2 mt-1 rounded-full bg-white/10 overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress * 100}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-neonCyan to-electricViolet shadow-[0_0_10px_rgba(0,209,255,0.5)]"
            />
          </div>
          <p className="text-xs text-white/60 mt-1">{xp} / {xpForNextLevel} XP</p>
        </div>
      </div>

      <div className="flex w-full items-center justify-center gap-2 glass-panel px-4 py-2 rounded-xl border-electricViolet/30 sm:w-auto">
        <Flame className="text-orange-500 w-5 h-5 animate-pulse-slow" />
        <span className="font-semibold text-white">{studyStreak} Day Streak</span>
      </div>
    </motion.div>
  );
}
