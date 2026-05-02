"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, X, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { useStore } from "@/store/useStore";

export function FocusMode({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isActive, setIsActive] = useState(false);
  const { addXP, setFocusMode } = useStore();

  useEffect(() => {
    setFocusMode(isOpen && isActive);
  }, [isOpen, isActive, setFocusMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handleComplete = () => {
    setIsActive(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00D1FF', '#8B5CF6', '#FFFFFF']
    });
    addXP(50); // Reward for completing a pomodoro
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-deepSpace flex items-center justify-center overflow-hidden"
        >
          {/* Starfield Background */}
          {isActive && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(100)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: Math.random(),
                    scale: Math.random() * 0.5 + 0.5,
                    x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                    y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                  }}
                  animate={{
                    y: [null, Math.random() * -500],
                    opacity: [null, 0],
                  }}
                  transition={{
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                />
              ))}
            </div>
          )}

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonCyan to-electricViolet mb-12 tracking-widest uppercase">
              Deep Focus
            </h2>

            <div className="relative mb-12">
              <motion.div 
                animate={isActive ? { scale: [1, 1.02, 1], filter: ["hue-rotate(0deg)", "hue-rotate(10deg)", "hue-rotate(0deg)"] } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-80 h-80 rounded-full border-4 border-white/5 flex items-center justify-center relative shadow-[0_0_50px_rgba(0,209,255,0.1)] glass-panel"
              >
                {isActive && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-t-4 border-neonCyan border-r-4 border-r-transparent border-b-4 border-b-transparent border-l-4 border-l-transparent"
                  />
                )}
                <span className="text-7xl font-light text-white font-mono">{formatTime(timeLeft)}</span>
              </motion.div>
            </div>

            <div className="flex gap-6">
              <button 
                onClick={toggleTimer}
                className="w-16 h-16 rounded-full bg-white text-deepSpace flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
              >
                {isActive ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
              </button>
              
              <button 
                onClick={resetTimer}
                className="w-16 h-16 rounded-full glass-panel flex items-center justify-center text-white/70 hover:text-white hover:scale-110 transition-all"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
