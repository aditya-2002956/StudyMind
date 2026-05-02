"use client";

import { TopBar } from "@/components/TopBar";
import { UploadZone } from "@/components/UploadZone";
import { QuizData, QuizInterface, QuizSummary } from "@/components/QuizInterface";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function QuizPage() {
  const [quizState, setQuizState] = useState<"upload" | "quiz" | "done">("upload");
  const [isDemo, setIsDemo] = useState(false);
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [summary, setSummary] = useState<QuizSummary | null>(null);
  const [nextDifficulty, setNextDifficulty] = useState<"medium" | "hard" | "competitive">("medium");
  const [lastPdf, setLastPdf] = useState<File | null>(null);
  const [lastSubject, setLastSubject] = useState("Uploaded PDF");
  const [isGeneratingHarder, setIsGeneratingHarder] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsDemo(localStorage.getItem("studymind:mode") === "demo");
  }, []);

  const generateQuizFromFile = async (file: File, subject: string, difficulty: "medium" | "hard" | "competitive") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", localStorage.getItem("studymind:user_id") || "demo-user");
    formData.append("subject", subject || "Uploaded PDF");
    formData.append("question_count", difficulty === "competitive" ? "7" : difficulty === "hard" ? "6" : "5");
    formData.append("difficulty", difficulty);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8010"}/api/v1/quizzes/from-pdf`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data?.detail || "Could not generate quiz from this PDF.");
    }
    return data as QuizData;
  };

  const handleHarderQuiz = async () => {
    setNextDifficulty("hard");
    setSummary(null);

    if (!lastPdf) {
      setQuiz(null);
      setQuizState("upload");
      return;
    }

    setIsGeneratingHarder(true);
    try {
      const harderQuiz = await generateQuizFromFile(lastPdf, lastSubject, "hard");
      setQuiz(harderQuiz);
      setQuizState("quiz");
    } finally {
      setIsGeneratingHarder(false);
    }
  };

  const handleCompetitiveQuiz = async () => {
    setNextDifficulty("competitive");
    setSummary(null);

    if (!lastPdf) {
      setQuiz(null);
      setQuizState("upload");
      return;
    }

    setIsGeneratingHarder(true);
    try {
      const competitiveQuiz = await generateQuizFromFile(lastPdf, lastSubject, "competitive");
      setQuiz(competitiveQuiz);
      setQuizState("quiz");
    } finally {
      setIsGeneratingHarder(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col relative overflow-x-hidden min-h-screen bg-deepSpace">
      <div className="absolute top-[20%] left-[50%] -translate-x-1/2 w-[80%] h-[50%] bg-neonCyan/10 blur-[150px] rounded-full pointer-events-none" />

      <TopBar />

      <div className="flex-1 px-4 py-6 sm:p-6 z-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-4xl">
          <header className="mb-8 sm:mb-12 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight mb-4">
              The Weakness Detector
            </h1>
            <p className="text-white/50 max-w-lg mx-auto">
              {isDemo
                ? "Demo mode uses sample questions so you can show the flow quickly."
                : "Upload a PDF. StudyMind will read it and generate a targeted quiz from that material."}
            </p>
          </header>

          <AnimatePresence mode="wait">
            {quizState === "upload" && (
              <motion.div
                key="upload"
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                {isDemo ? (
                  <div className="glass-panel rounded-2xl p-6 sm:p-10 text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">Demo Quiz Ready</h2>
                    <p className="text-white/50 max-w-md mx-auto mb-8">
                      These are mock questions and will only appear in demo mode. Real users must upload a PDF to generate their quiz.
                    </p>
                    <button
                      onClick={() => setQuizState("quiz")}
                      className="px-8 py-3 rounded-full bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/50 text-neonCyan font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,209,255,0.3)]"
                    >
                      Start Demo Quiz
                    </button>
                  </div>
                ) : (
                  <UploadZone
                    initialDifficulty={nextDifficulty}
                    retainedFile={lastPdf}
                    retainedSubject={lastSubject}
                    onQuizReady={(generatedQuiz, file, subject) => {
                      setLastPdf(file);
                      setLastSubject(subject);
                      setQuiz(generatedQuiz);
                      setQuizState("quiz");
                    }}
                  />
                )}
              </motion.div>
            )}

            {quizState === "quiz" && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
              >
                <QuizInterface
                  quiz={quiz}
                  isDemo={isDemo}
                  onComplete={(quizSummary) => {
                    setSummary(quizSummary);
                    setQuizState("done");
                  }}
                />
              </motion.div>
            )}

            {quizState === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-6 sm:p-10 rounded-2xl text-center"
              >
                <h2 className="text-3xl font-bold text-white mb-4">Analysis Complete</h2>
                <p className="text-white/70 mb-8 max-w-md mx-auto">
                  {summary
                    ? `You scored ${summary.correct}/${summary.total} in ${summary.subject}.`
                    : "We've mapped your weaknesses. Your global skill map and planner have been updated."}
                </p>
                {summary && (
                  <div className="mb-8 space-y-3 text-left">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-white/50">Weak topics from this quiz</h3>
                    {summary.weakTopics.length > 0 ? (
                      summary.weakTopics.map((topic) => (
                        <div key={topic.topic} className="rounded-xl border border-red-400/20 bg-red-400/10 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-white">{topic.topic}</p>
                            <span className="text-sm text-red-300">{topic.accuracy}%</span>
                          </div>
                          <p className="mt-1 text-sm text-white/50">
                            {topic.correct}/{topic.attempted} correct. Revise this before taking the next quiz.
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-300">
                        No weak topics detected from this quiz. Try a harder quiz to verify mastery.
                      </div>
                    )}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="px-8 py-3 rounded-full bg-white text-deepSpace font-bold hover:bg-neonCyan transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,209,255,0.4)]"
                  >
                    Return to Dashboard
                  </button>
                  <button
                    onClick={() => router.push('/weak-topics')}
                    className="px-8 py-3 rounded-full bg-red-400/10 border border-red-400/30 text-red-300 font-bold hover:bg-red-400/20 transition-all duration-300"
                  >
                    View Weak Topics
                  </button>
                  {summary && summary.weakTopics.length === 0 && (
                    <>
                      <button
                        onClick={() => {
                          void handleHarderQuiz();
                        }}
                        disabled={isGeneratingHarder}
                        className="px-8 py-3 rounded-full bg-neonCyan/15 border border-neonCyan/40 text-neonCyan font-bold hover:bg-neonCyan/25 transition-all duration-300"
                      >
                        {isGeneratingHarder ? "Generating..." : "Take Harder Quiz"}
                      </button>
                      <button
                        onClick={() => {
                          void handleCompetitiveQuiz();
                        }}
                        disabled={isGeneratingHarder}
                        className="px-8 py-3 rounded-full bg-electricViolet/15 border border-electricViolet/40 text-electricViolet font-bold hover:bg-electricViolet/25 transition-all duration-300"
                      >
                        {isGeneratingHarder ? "Generating..." : "Competitive Quiz"}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
