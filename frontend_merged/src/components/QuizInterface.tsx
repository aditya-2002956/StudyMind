"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Check, X, ArrowRight, BrainCircuit } from "lucide-react";
import { useStore } from "@/store/useStore";

type QuizQuestion = {
  id: string | number;
  topic: string;
  prompt: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
};

export type QuizData = {
  id: string;
  subject: string;
  questions: QuizQuestion[];
};

export type QuizSummary = {
  subject: string;
  total: number;
  correct: number;
  weakTopics: Array<{ topic: string; attempted: number; correct: number; accuracy: number }>;
  topicStats: Array<{ topic: string; attempted: number; correct: number; accuracy: number }>;
};

const DEMO_QUIZ: QuizData = {
  id: "demo-quiz",
  subject: "Demo Science",
  questions: [
    {
      id: 1,
      prompt: "What is the primary function of a mitochondria?",
      options: ["Energy production", "Protein synthesis", "Waste disposal", "Cell division"],
      correct_option_index: 0,
      topic: "Cell Biology",
      explanation: "Mitochondria are responsible for producing cellular energy as ATP.",
    },
    {
      id: 2,
      prompt: "Which law states that for every action, there is an equal and opposite reaction?",
      options: ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Law of Gravity"],
      correct_option_index: 2,
      topic: "Classical Mechanics",
      explanation: "Newton's Third Law describes equal and opposite reaction forces.",
    },
  ],
};

export function QuizInterface({
  quiz,
  isDemo = false,
  onComplete,
}: {
  quiz?: QuizData | null;
  isDemo?: boolean;
  onComplete: (summary: QuizSummary) => void;
}) {
  const activeQuiz = isDemo ? DEMO_QUIZ : quiz;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState<Array<{ topic: string; isCorrect: boolean }>>([]);

  const { addXP, addWeaknessTag, recordQuizAnswer } = useStore();

  if (!activeQuiz?.questions?.length) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-white/70">
        Upload a PDF first so StudyMind can generate a quiz from your material.
      </div>
    );
  }

  const currentQuestion = activeQuiz.questions[currentIndex];

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === currentQuestion.correct_option_index;
    setSessionAnswers((answers) => [...answers, { topic: currentQuestion.topic, isCorrect }]);
    recordQuizAnswer(activeQuiz.subject, currentQuestion.topic, isCorrect);

    if (!isCorrect) {
      addWeaknessTag({
        id: Math.random().toString(),
        topic: activeQuiz.subject,
        subtopic: currentQuestion.topic,
        weight: 0.8,
      });
    } else {
      addXP(10);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeQuiz.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsAnalyzing(true);
      setTimeout(() => {
        setIsAnalyzing(false);
        const finalAnswers = sessionAnswers;
        const topicMap = new Map<string, { topic: string; attempted: number; correct: number; accuracy: number }>();
        for (const answer of finalAnswers) {
          const existing = topicMap.get(answer.topic) || { topic: answer.topic, attempted: 0, correct: 0, accuracy: 0 };
          existing.attempted += 1;
          existing.correct += answer.isCorrect ? 1 : 0;
          existing.accuracy = Math.round((existing.correct / existing.attempted) * 100);
          topicMap.set(answer.topic, existing);
        }
        const topicStats = Array.from(topicMap.values()).sort((a, b) => a.accuracy - b.accuracy);
        onComplete({
          subject: activeQuiz.subject,
          total: finalAnswers.length,
          correct: finalAnswers.filter((answer) => answer.isCorrect).length,
          weakTopics: topicStats.filter((topic) => topic.accuracy < 75),
          topicStats,
        });
      }, 1600);
    }
  };

  if (isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[320px] flex-col items-center justify-center p-6 sm:p-12 glass-panel rounded-2xl"
      >
        <motion.div
          animate={{
            rotate: 360,
            scale: [1, 1.2, 1],
            filter: ["hue-rotate(0deg)", "hue-rotate(90deg)", "hue-rotate(0deg)"],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-t-neonCyan border-r-electricViolet border-b-transparent border-l-transparent mb-8 flex items-center justify-center"
        >
          <BrainCircuit className="w-9 h-9 sm:w-10 sm:h-10 text-white animate-pulse" />
        </motion.div>
        <h2 className="text-xl sm:text-2xl text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-neonCyan to-electricViolet">
          Analyzing Weaknesses...
        </h2>
        <p className="text-white/50 mt-4 text-center max-w-sm">
          Mapping your answers to identify areas for targeted study.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto min-h-[520px] sm:min-h-[480px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 glass-panel p-5 sm:p-8 rounded-2xl flex flex-col overflow-y-auto"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
            <span className="text-sm font-medium text-neonCyan tracking-widest uppercase">
              Question {currentIndex + 1} of {activeQuiz.questions.length}
            </span>
            <span className="w-fit px-3 py-1 rounded-full bg-white/5 text-white/50 text-xs">
              {currentQuestion.topic}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold text-white mb-6 sm:mb-8 leading-relaxed">
            {currentQuestion.prompt}
          </h2>

          <div className="space-y-4 flex-1">
            {currentQuestion.options.map((option, idx) => {
              const isCorrect = idx === currentQuestion.correct_option_index;
              const isSelected = idx === selectedOption;

              let buttonClasses = "w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center justify-between gap-3 ";

              if (!isAnswered) {
                buttonClasses += "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80";
              } else if (isCorrect) {
                buttonClasses += "border-green-500/50 bg-green-500/10 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
              } else if (isSelected && !isCorrect) {
                buttonClasses += "border-red-500/50 bg-red-500/10 text-red-400";
              } else {
                buttonClasses += "border-white/5 bg-white/5 text-white/30 opacity-50";
              }

              return (
                <button
                  key={`${currentQuestion.id}-${idx}`}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isAnswered}
                  className={buttonClasses}
                >
                  <span className="min-w-0">{option}</span>
                  {isAnswered && isCorrect && <Check className="w-5 h-5 shrink-0 text-green-400" />}
                  {isAnswered && isSelected && !isCorrect && <X className="w-5 h-5 shrink-0 text-red-400" />}
                </button>
              );
            })}
          </div>

          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex flex-col gap-4"
            >
              <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                {currentQuestion.explanation}
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-5 sm:px-6 py-2 rounded-full bg-white text-deepSpace font-bold hover:bg-neonCyan transition-colors duration-300"
                >
                  {currentIndex < activeQuiz.questions.length - 1 ? "Next Question" : "Finish Quiz"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
