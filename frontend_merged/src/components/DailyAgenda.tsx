"use client";

import { useStore } from "@/store/useStore";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, CheckCircle2, Clock, ExternalLink, RefreshCw, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AgendaTask = {
  id: string;
  title: string;
  time: string;
  duration: string;
  type: "regular" | "targeted";
  completed?: boolean;
};

const INITIAL_TASKS: AgendaTask[] = [
  { id: "math-notes", title: "Review Math Notes", time: "10:00 AM", duration: "45m", type: "regular" },
  { id: "essay-draft", title: "History Essay Draft", time: "1:00 PM", duration: "90m", type: "regular" },
  { id: "physics-practice", title: "Physics Practice", time: "3:30 PM", duration: "60m", type: "regular" },
];

function durationToMinutes(duration: string) {
  const number = Number.parseInt(duration, 10);
  if (duration.toLowerCase().includes("h")) return number * 60;
  return Number.isFinite(number) ? number : 45;
}

function calendarDate(time: string, duration: string) {
  const date = new Date();
  const match = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match) {
    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();
    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    date.setHours(hours, minutes, 0, 0);
  }
  const end = new Date(date.getTime() + durationToMinutes(duration) * 60_000);
  return { start: date, end };
}

function formatIcsDate(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function DailyAgenda() {
  const { weaknessTags } = useStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<AgendaTask[]>(INITIAL_TASKS);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const completedCount = useMemo(() => tasks.filter((task) => task.completed).length, [tasks]);

  const handleSmartReschedule = () => {
    setIsRescheduling(true);

    setTimeout(() => {
      const newTasks: AgendaTask[] = weaknessTags.slice(0, 3).map((tag, idx) => ({
        id: `weak-${tag.subtopic}-${idx}`,
        title: `Targeted: ${tag.subtopic}`,
        time: idx === 0 ? "9:00 AM" : idx === 1 ? "11:00 AM" : "4:00 PM",
        duration: "60m",
        type: "targeted",
      }));

      setTasks([...newTasks, ...INITIAL_TASKS.slice(newTasks.length > 0 ? 1 : 0)]);
      setSyncMessage(newTasks.length ? "Agenda prioritized weak topics." : "No weak topics yet, so the regular agenda stayed in place.");
      setIsRescheduling(false);
    }, 900);
  };

  const toggleComplete = (taskId: string) => {
    setTasks((current) =>
      current.map((task) => task.id === taskId ? { ...task, completed: !task.completed } : task)
    );
  };

  const handleFocusTask = (task: AgendaTask) => {
    localStorage.setItem("studymind:focus_task", JSON.stringify(task));
    router.push(task.type === "targeted" ? "/weak-topics" : "/planner");
  };

  const handleCalendarSync = () => {
    const activeTasks = tasks.filter((task) => !task.completed);
    if (!activeTasks.length) {
      setSyncMessage("All tasks are complete, so there is nothing to sync.");
      return;
    }

    const events = activeTasks.map((task) => {
      const { start, end } = calendarDate(task.time, task.duration);
      return [
        "BEGIN:VEVENT",
        `UID:${task.id}-${start.getTime()}@studymind.local`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        `DTSTART:${formatIcsDate(start)}`,
        `DTEND:${formatIcsDate(end)}`,
        `SUMMARY:${task.title}`,
        "DESCRIPTION:StudyMind daily agenda block",
        "END:VEVENT",
      ].join("\r\n");
    });

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//StudyMind//Daily Agenda//EN",
      ...events,
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "studymind-daily-agenda.ics";
    link.click();
    URL.revokeObjectURL(url);
    setSyncMessage("Calendar file downloaded. Open it to add these blocks to Google/Apple/Outlook Calendar.");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-5 sm:p-6 rounded-2xl w-full flex flex-col h-full"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white tracking-wider">Daily Agenda</h3>
          <p className="text-sm text-white/50">
            {completedCount}/{tasks.length} done today.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleSmartReschedule}
            disabled={isRescheduling}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-electricViolet/20 text-electricViolet border border-electricViolet/30 hover:bg-electricViolet/30 transition-all hover:shadow-[0_0_15px_rgba(139,92,246,0.3)] disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isRescheduling ? "animate-spin" : ""}`} />
            Smart Reschedule
          </button>

          <button
            onClick={handleCalendarSync}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] text-sm font-medium group"
          >
            <CalendarIcon className="w-4 h-4 text-white/70 group-hover:text-white" />
            Sync to Calendar
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="mb-4 rounded-xl border border-neonCyan/20 bg-neonCyan/10 px-4 py-3 text-sm text-neonCyan">
          {syncMessage}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        {tasks.map((task, idx) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-4 rounded-xl border ${
              task.type === "targeted"
                ? "bg-neonCyan/10 border-neonCyan/30 shadow-[inset_4px_0_0_rgba(0,209,255,1)]"
                : "bg-white/5 border-white/10 hover:bg-white/10"
            } ${task.completed ? "opacity-60" : ""} transition-colors duration-300`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h4 className={`font-semibold ${task.type === "targeted" ? "text-neonCyan" : "text-white"}`}>
                  {task.title}
                </h4>
                <div className="flex items-center gap-2 text-white/50 text-sm mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{task.time} ({task.duration})</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {task.type === "targeted" && (
                  <span className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider bg-neonCyan/20 text-neonCyan border border-neonCyan/30">
                    Priority
                  </span>
                )}
                <button
                  onClick={() => toggleComplete(task.id)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                    task.completed
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/70 hover:text-white"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {task.completed ? "Done" : "Mark Done"}
                </button>
                <button
                  onClick={() => handleFocusTask(task)}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  {task.type === "targeted" ? <Target className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  {task.type === "targeted" ? "Review" : "Open"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
