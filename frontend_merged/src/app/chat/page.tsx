"use client";

import { motion } from "framer-motion";
import { TopBar } from "@/components/TopBar";
import { MessageSquare, Send, BrainCircuit, Sparkles, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store/useStore";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content: "Hi, I am your Socratic AI Tutor. Ask me a doubt, paste a question, or tell me where you got stuck. I will guide you with hints first, then steps if you need them.",
  }
];

type ChatApiResponse = {
  answer: string;
  suggested_next_step: string;
  used_context: string[];
  provider: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const bottomRef = useRef<HTMLDivElement>(null);
  const weaknessTags = useStore((state) => state.weaknessTags);
  const quizTopicStats = useStore((state) => state.quizTopicStats);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const buildTutorContext = () => {
    const weakTopics = weaknessTags.map((item) => item.subtopic);
    const topicSummary = quizTopicStats
      .slice(-8)
      .map((item) => `${item.subject} / ${item.topic}: ${item.correct}/${item.attempted} correct`)
      .join("; ");
    return {
      weakTopics,
      subject: weaknessTags[0]?.topic || quizTopicStats[0]?.subject || "General Study",
      topic: weaknessTags[0]?.subtopic || quizTopicStats[0]?.topic || undefined,
      context: topicSummary ? `Recent quiz performance: ${topicSummary}` : "No quiz performance yet.",
    };
  };

  const handleSend = async (overrideMessage?: string) => {
    const outgoing = (overrideMessage || inputValue).trim();
    if (!outgoing || isTyping) return;

    const newUserMsg: Message = { id: Date.now().toString(), role: "user", content: outgoing };
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const tutorContext = buildTutorContext();
      const response = await apiFetch<ChatApiResponse>("/api/v1/chat", {
        method: "POST",
        body: JSON.stringify({
          user_id: localStorage.getItem("studymind:user_id") || "demo-user",
          subject: tutorContext.subject,
          topic: tutorContext.topic,
          message: outgoing,
          weak_topics: tutorContext.weakTopics,
          context: tutorContext.context,
          history: messages.slice(-8).map((item) => ({
            role: item.role === "ai" ? "assistant" : "user",
            content: item.content,
          })),
        }),
      });

      setProvider(response.provider);
      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: response.answer,
      };
      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "The tutor could not respond.";
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: `I could not reach the AI tutor just now. Try again in a moment.\n\nDetails: ${fallback}`,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSummary = () => {
    handleSend("Summarize my recent weak topics and give me a short 20-minute study plan.");
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-hidden h-screen bg-deepSpace">
      {/* Background ambient light */}
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[50%] bg-neonCyan/10 blur-[150px] rounded-full pointer-events-none" />

      <TopBar />

      <div className="flex-1 flex flex-col z-10 max-w-5xl mx-auto w-full p-4 md:p-6 overflow-hidden">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-neonCyan to-electricViolet flex items-center justify-center shadow-[0_0_20px_rgba(0,209,255,0.4)]">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight">
                Socratic AI Tutor
              </h1>
              <p className="text-white/50 text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)] animate-pulse" />
                Neural link active
              </p>
            </div>
          </div>
          <button onClick={handleSummary} className="hidden md:flex px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-all items-center gap-2">
            <Sparkles className="w-4 h-4 text-neonCyan" />
            Generate Summary
          </button>
        </header>

        <div className="flex-1 glass-panel rounded-3xl border-white/10 flex flex-col overflow-hidden relative">
          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.map((msg) => (
              <motion.div 
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border ${
                  msg.role === 'ai' 
                    ? 'bg-neonCyan/20 border-neonCyan text-neonCyan shadow-[0_0_10px_rgba(0,209,255,0.2)]' 
                    : 'bg-electricViolet/20 border-electricViolet text-electricViolet'
                }`}>
                  {msg.role === 'ai' ? <BrainCircuit className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'ai' 
                    ? 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm' 
                    : 'bg-gradient-to-br from-electricViolet/20 to-neonCyan/20 border border-white/10 text-white rounded-tr-sm'
                }`}>
                  <p className="leading-relaxed">{msg.content}</p>
                </div>
              </motion.div>
            ))}
            
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-4 max-w-[80%]"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-neonCyan/20 border border-neonCyan text-neonCyan flex items-center justify-center shadow-[0_0_10px_rgba(0,209,255,0.2)]">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 rounded-tl-sm flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-neonCyan animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neonCyan animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-neonCyan animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-black/20 border-t border-white/10 backdrop-blur-md">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-white/40">
              <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                Provider: {provider}
              </span>
              {weaknessTags.slice(0, 3).map((item) => (
                <button
                  key={`${item.topic}-${item.subtopic}`}
                  onClick={() => handleSend(`Help me understand ${item.subtopic} in ${item.topic} with one hint and one practice question.`)}
                  className="px-3 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-200 hover:bg-red-400/20"
                >
                  {item.subtopic}
                </button>
              ))}
            </div>
            <div className="relative flex items-end gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask your tutor a question... (Shift+Enter for new line)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-4 pr-12 text-white placeholder-white/30 focus:outline-none focus:border-neonCyan/50 focus:ring-1 focus:ring-neonCyan/50 transition-all resize-none min-h-[60px] max-h-[150px] overflow-y-auto scrollbar-none"
                rows={1}
              />
              <button 
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 bottom-2 p-3 rounded-xl bg-neonCyan text-deepSpace hover:bg-white hover:shadow-[0_0_15px_rgba(0,209,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
