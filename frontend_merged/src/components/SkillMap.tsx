"use client";

import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

const MOCK_DATA = [
  { subject: "Physics", A: 80, fullMark: 100 },
  { subject: "Logic", A: 90, fullMark: 100 },
  { subject: "Memory", A: 60, fullMark: 100 },
  { subject: "Math", A: 85, fullMark: 100 },
  { subject: "History", A: 70, fullMark: 100 },
];

export function SkillMap() {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="glass-panel p-6 rounded-2xl w-full h-[400px] flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute w-64 h-64 bg-neonCyan/10 rounded-full blur-3xl" />
      
      <h3 className="text-xl font-bold text-white mb-4 z-10 tracking-wider">Skill Map</h3>
      
      <div className="w-full h-full z-10">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_DATA}>
            <PolarGrid stroke="rgba(255,255,255,0.1)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Student"
              dataKey="A"
              stroke="#00D1FF"
              strokeWidth={2}
              fill="#00D1FF"
              fillOpacity={0.3}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
