import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WeaknessTag {
  id: string;
  topic: string;
  subtopic: string;
  weight: number; // 0 to 1, higher means weaker
}

export interface QuizTopicStat {
  topic: string;
  subject: string;
  attempted: number;
  correct: number;
}

interface StudyMindState {
  xp: number;
  level: number;
  studyStreak: number;
  weaknessTags: WeaknessTag[];
  quizTopicStats: QuizTopicStat[];
  isFocusModeActive: boolean;
  addXP: (amount: number) => void;
  addWeaknessTag: (tag: WeaknessTag) => void;
  recordQuizAnswer: (subject: string, topic: string, isCorrect: boolean) => void;
  setFocusMode: (isActive: boolean) => void;
}

export const useStore = create<StudyMindState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      studyStreak: 0,
      weaknessTags: [],
      quizTopicStats: [],
      isFocusModeActive: false,

      addXP: (amount) => set((state) => {
        const newXP = state.xp + amount;
        const newLevel = Math.floor(newXP / 100) + 1;
        return { xp: newXP, level: newLevel };
      }),

      addWeaknessTag: (tag) => set((state) => ({
        weaknessTags: [...state.weaknessTags.filter((item) => item.subtopic !== tag.subtopic), tag]
      })),

      recordQuizAnswer: (subject, topic, isCorrect) => set((state) => {
        const existing = state.quizTopicStats.find((item) => item.topic === topic && item.subject === subject);
        const nextStats = existing
          ? state.quizTopicStats.map((item) =>
              item.topic === topic && item.subject === subject
                ? { ...item, attempted: item.attempted + 1, correct: item.correct + (isCorrect ? 1 : 0) }
                : item
            )
          : [...state.quizTopicStats, { topic, subject, attempted: 1, correct: isCorrect ? 1 : 0 }];

        const updated = nextStats.find((item) => item.topic === topic && item.subject === subject);
        const accuracy = updated ? updated.correct / updated.attempted : 1;
        const existingWeaknesses = state.weaknessTags.filter((item) => !(item.topic === subject && item.subtopic === topic));
        const nextWeaknessTags = accuracy < 0.75
          ? [
              ...existingWeaknesses,
              { id: `${subject}-${topic}`, topic: subject, subtopic: topic, weight: Math.max(0.25, 1 - accuracy) },
            ]
          : existingWeaknesses;

        return { quizTopicStats: nextStats, weaknessTags: nextWeaknessTags };
      }),

      setFocusMode: (isActive) => set({ isFocusModeActive: isActive }),
    }),
    {
      name: 'studymind:progress',
      partialize: (state) => ({
        xp: state.xp,
        level: state.level,
        studyStreak: state.studyStreak,
        weaknessTags: state.weaknessTags,
        quizTopicStats: state.quizTopicStats,
      }),
    }
  )
)
