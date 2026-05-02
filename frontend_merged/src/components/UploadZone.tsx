"use client";

import { motion } from "framer-motion";
import { FileText, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

type Quiz = {
  id: string;
  subject: string;
  questions: Array<{
    id: string;
    topic: string;
    prompt: string;
    options: string[];
    correct_option_index: number;
    explanation: string;
  }>;
};

export function UploadZone({
  initialDifficulty = "medium",
  retainedFile = null,
  retainedSubject = "Uploaded PDF",
  onQuizReady,
}: {
  initialDifficulty?: "medium" | "hard" | "competitive";
  retainedFile?: File | null;
  retainedSubject?: string;
  onQuizReady: (quiz: Quiz, file: File, subject: string) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(retainedFile);
  const [subject, setSubject] = useState(retainedSubject);
  const [difficulty, setDifficulty] = useState<"medium" | "hard" | "competitive">(initialDifficulty);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const selectFile = (file: File) => {
    setError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setSelectedFile(file);
    if (subject === "Uploaded PDF") {
      setSubject(file.name.replace(/\.pdf$/i, "").slice(0, 60) || "Uploaded PDF");
    }
  };

  const startUpload = async () => {
    if (!selectedFile) {
      inputRef.current?.click();
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("user_id", localStorage.getItem("studymind:user_id") || "demo-user");
      formData.append("subject", subject || "Uploaded PDF");
      formData.append("question_count", "5");
      formData.append("difficulty", difficulty);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8010"}/api/v1/quizzes/from-pdf`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = typeof data?.detail === "string" ? data.detail : "Could not generate quiz from this PDF.";
        throw new Error(
          detail.includes("Gemini")
            ? `${detail} Check Render environment variables: GEMINI_API_KEY and GEMINI_MODEL.`
            : detail
        );
      }
      onQuizReady(data, selectedFile, subject || "Uploaded PDF");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass-panel rounded-2xl p-5 sm:p-8 lg:p-10 flex flex-col items-center justify-center border-2 border-dashed transition-colors duration-300 cursor-pointer ${
        isDragging ? "border-neonCyan bg-neonCyan/10 shadow-[0_0_30px_rgba(0,209,255,0.2)]" : "border-white/20"
      }`}
      onDoubleClick={() => inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) selectFile(file);
        }}
      />

      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 relative">
        {isUploading && (
          <div className="absolute inset-0 rounded-full border-2 border-neonCyan border-t-transparent animate-spin" />
        )}
        {selectedFile ? (
          <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-neonCyan" />
        ) : (
          <UploadCloud className={`w-8 h-8 sm:w-10 sm:h-10 ${isDragging ? "text-neonCyan" : "text-white/60"}`} />
        )}
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">
        {isDragging ? "Drop PDF to Attach" : "Upload Study Material"}
      </h3>
      <p className="text-white/50 text-center mb-6 max-w-sm">
        Drag and drop a text-based PDF here, or use Browse PDF. StudyMind will read it and generate a targeted quiz from the actual material.
      </p>

      <div className="w-full max-w-md space-y-3 mb-6">
        <div className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/35">Detected material</p>
          <p className="mt-1 truncate text-white">{subject || "Upload a PDF to detect chapter"}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(["medium", "hard", "competitive"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setDifficulty(level)}
              className={`rounded-xl border px-3 py-3 text-xs sm:text-sm font-semibold capitalize transition-all ${
                difficulty === level
                  ? "border-neonCyan bg-neonCyan/20 text-neonCyan"
                  : "border-white/10 bg-white/5 text-white/55 hover:text-white"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
        {selectedFile && (
          <div className="rounded-xl border border-neonCyan/30 bg-neonCyan/10 px-4 py-3 text-sm text-neonCyan">
            {selectedFile.name}
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/75 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Browse PDF
        </button>
        <button
        onClick={startUpload}
        disabled={isUploading}
        className="px-8 py-3 rounded-full bg-neonCyan/20 hover:bg-neonCyan/30 border border-neonCyan/50 text-neonCyan font-medium transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,209,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? "Analyzing..." : "Generate Quiz"}
        </button>
      </div>
    </motion.div>
  );
}
