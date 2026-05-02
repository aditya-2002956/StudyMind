"use client";

import { motion } from "framer-motion";
import { LayoutDashboard, BrainCircuit, Calendar, MessageSquare, Settings, LogOut, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: AlertTriangle, label: "Weak Topics", href: "/weak-topics" },
  { icon: BrainCircuit, label: "Quizzes", href: "/quizzes" },
  { icon: Calendar, label: "Planner", href: "/planner" },
  { icon: MessageSquare, label: "AI Tutor", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("studymind:access_token");
    localStorage.removeItem("studymind:email");
    localStorage.removeItem("studymind:mode");
    router.push("/login");
  };

  return (
    <motion.aside 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden w-64 h-[calc(100vh-2rem)] m-4 glass-panel rounded-3xl lg:flex flex-col fixed left-0 top-0 z-40 border-white/10"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neonCyan to-electricViolet flex items-center justify-center shadow-[0_0_20px_rgba(0,209,255,0.4)]">
          <BrainCircuit className="text-white w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 tracking-wider">
          StudyMind
        </h1>
      </div>

      <div className="flex-1 px-4 py-6 flex flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, x: 5 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 relative overflow-hidden group ${
                  isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-r from-neonCyan/20 to-transparent border-l-2 border-neonCyan"
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${isActive ? "text-neonCyan" : "group-hover:text-neonCyan transition-colors"}`} />
                <span className="font-medium relative z-10">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-auto relative">
        <div className="flex flex-col gap-2">
          <button onClick={handleLogout} className="flex items-center gap-4 px-4 py-3 rounded-2xl text-white/60 hover:text-white hover:bg-red-500/10 hover:text-red-400 transition-all duration-300">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
