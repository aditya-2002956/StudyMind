"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store/useStore";

type TutorMessage = { role: "user" | "ai"; content: string };

type ChatApiResponse = {
  answer: string;
  suggested_next_step: string;
  used_context: string[];
  provider: string;
};

export function AITutorDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([
    { role: "ai", content: "Hello! I am your Socratic Tutor. Ask me a doubt and I will guide you with hints, steps, and practice." }
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [provider, setProvider] = useState("gemini");
  const weaknessTags = useStore((state) => state.weaknessTags);
  const quizTopicStats = useStore((state) => state.quizTopicStats);

  const buildTutorContext = () => {
    const weakTopics = weaknessTags.map((item) => item.subtopic);
    const topicSummary = quizTopicStats
      .slice(-6)
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
    const outgoing = (overrideMessage || input).trim();
    if (!outgoing || isThinking) return;
    
    setMessages(prev => [...prev, { role: "user", content: outgoing }]);
    setInput("");
    setIsThinking(true);

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
      setMessages(prev => [...prev, { role: "ai", content: response.answer }]);
    } catch (error) {
      const fallback = error instanceof Error ? error.message : "The tutor could not respond.";
      setMessages(prev => [...prev, {
        role: "ai",
        content: `I could not reach the AI tutor just now. Try again in a moment.\n\nDetails: ${fallback}`,
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-electricViolet flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:scale-110 transition-transform z-40"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-[400px] glass-panel bg-deepSpace/95 border-l border-white/10 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-electricViolet to-neonCyan flex items-center justify-center p-0.5">
                  <div className="w-full h-full bg-deepSpace rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-neonCyan" />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-white">Socratic Tutor</h3>
                  <p className="text-xs text-neonCyan">Online via {provider}</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-electricViolet text-white rounded-br-none' 
                      : 'bg-white/5 border border-white/10 text-white/90 rounded-bl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-neonCyan animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-neonCyan animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 rounded-full bg-neonCyan animate-pulse" style={{ animationDelay: "0.4s" }} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10">
              {weaknessTags.length ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {weaknessTags.slice(0, 3).map((item) => (
                    <button
                      key={`${item.topic}-${item.subtopic}`}
                      onClick={() => handleSend(`Give me one hint and one practice question for ${item.subtopic} in ${item.topic}.`)}
                      className="px-3 py-1 rounded-full bg-red-400/10 border border-red-400/20 text-red-200 text-xs hover:bg-red-400/20"
                    >
                      {item.subtopic}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="What's on your mind?"
                  className="w-full bg-white/5 border border-white/10 rounded-full px-6 py-4 text-white placeholder-white/30 focus:outline-none focus:border-neonCyan focus:ring-1 focus:ring-neonCyan transition-all"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isThinking}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-neonCyan text-deepSpace flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
