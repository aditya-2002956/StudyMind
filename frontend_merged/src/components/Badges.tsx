"use client";

import { motion } from "framer-motion";
import { Zap, Brain, Target, Star, Shield } from "lucide-react";

const BADGES = [
  { id: 1, name: "Focus Master", icon: Target, color: "text-neonCyan", glow: "shadow-[0_0_15px_rgba(0,209,255,0.4)]", bg: "bg-neonCyan/10" },
  { id: 2, name: "7-Day Streak", icon: Zap, color: "text-orange-400", glow: "shadow-[0_0_15px_rgba(251,146,60,0.4)]", bg: "bg-orange-400/10" },
  { id: 3, name: "Logic Guru", icon: Brain, color: "text-electricViolet", glow: "shadow-[0_0_15px_rgba(139,92,246,0.4)]", bg: "bg-electricViolet/10" },
  { id: 4, name: "Early Bird", icon: Star, color: "text-yellow-300", glow: "shadow-[0_0_15px_rgba(253,224,71,0.4)]", bg: "bg-yellow-300/10" },
  { id: 5, name: "Consistency", icon: Shield, color: "text-green-400", glow: "shadow-[0_0_15px_rgba(74,222,128,0.4)]", bg: "bg-green-400/10" },
];

export function Badges() {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="glass-panel p-6 rounded-2xl w-full"
    >
      <h3 className="text-xl font-bold text-white mb-6 tracking-wider">Achievements</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {BADGES.map((badge, idx) => {
          const Icon = badge.icon;
          return (
            <motion.div
              key={badge.id}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`flex flex-col items-center justify-center p-4 rounded-xl glass-panel cursor-pointer relative overflow-hidden group`}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${badge.bg} blur-xl`} />
              
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${badge.bg} ${badge.glow} border border-white/10 relative z-10`}>
                <Icon className={`w-7 h-7 ${badge.color} drop-shadow-md`} />
              </div>
              <span className="text-sm font-medium text-white/80 text-center relative z-10">{badge.name}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
