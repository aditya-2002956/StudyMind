"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BrainCircuit,
  Target,
  Lightbulb,
  BookOpen,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  GraduationCap,
  Database,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

function onboardingCompleteKey(userId: string | null) {
  return userId ? `studymind:onboarding_complete:${userId}` : "studymind:onboarding_complete";
}

type OnboardingData = {
  name: string;
  educationSystem: string;
  classLevel: string;
  stream: string;
  university: string;
  targetExam: string;
  currentSubjects: string[];
  weakAreas: string[];
  strongAreas: string[];
  learningStyle: string;
  weeklyHours: number;
  wantNotebooks: boolean | null;
  wantMaterialsLater: boolean | null;
  materialSources: string[];
};

type BackendOnboardingResult = {
  recommended_domains: Array<{ name: string; confidence: number; reason: string; source?: string }>;
  suggested_next_subjects: string[];
  notebook_needs: string[];
  study_material_needs: string[];
  starter_material_sources: Array<{ title: string; url: string; notes?: string; provider?: string; relevance?: number }>;
  next_step: string;
};

type MaterialSearchResult = {
  results: Array<{ title: string; url: string; notes?: string; provider?: string; source_type?: string; relevance?: number }>;
  search_queries: string[];
  note: string;
};

const EDUCATION_OPTIONS = [
  "CBSE",
  "ICSE / ISC",
  "State Board",
  "B.E. / B.Tech",
  "B.Sc",
  "BCA",
  "B.Com",
  "BBA",
  "B.A.",
  "M.E. / M.Tech",
  "M.Sc",
  "MCA",
  "MBA",
  "Diploma",
  "Other",
];
const CBSE_CLASSES = ["Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];
const DEGREE_SEMESTERS = ["Semester 1", "Semester 2", "Semester 3", "Semester 4", "Semester 5", "Semester 6", "Semester 7", "Semester 8"];
const DEGREE_STREAMS = [
  "Computer Science / CSE",
  "AI / ML / Data Science",
  "Information Science / IT",
  "ECE",
  "EEE",
  "Mechanical",
  "Civil",
  "Commerce / Finance",
  "Management",
  "Humanities",
  "Placements / GATE",
];
const CBSE_STREAMS = ["Science", "Commerce", "Humanities", "Secondary", "Middle School"];
const SOURCE_OPTIONS = ["VTU syllabus", "CBSE curriculum", "NCERT", "previous-year papers later", "college notes later", "uploaded PDFs later"];
const LEARNING_STYLES = [
  { id: "mixed", label: "Mixed Mode" },
  { id: "visual", label: "Visual (Diagrams & Videos)" },
  { id: "practice-first", label: "Practice-first" },
  { id: "socratic", label: "Socratic Hints" },
  { id: "reading", label: "Reading/Writing" },
];

const defaultData: OnboardingData = {
  name: "",
  educationSystem: "B.E. / B.Tech",
  classLevel: "Semester 6",
  stream: "Computer Science / CSE",
  university: "VTU",
  targetExam: "VTU semester exams and placements",
  currentSubjects: ["Data Structures", "DBMS", "Operating Systems", "Machine Learning"],
  weakAreas: ["Data Structures", "DBMS"],
  strongAreas: ["Programming"],
  learningStyle: "mixed",
  weeklyHours: 10,
  wantNotebooks: true,
  wantMaterialsLater: true,
  materialSources: ["VTU syllabus", "previous-year papers later", "college notes later"],
};

function demoOnboardingResult(data: OnboardingData): BackendOnboardingResult {
  const isCbse = data.educationSystem === "CBSE";
  return {
    recommended_domains: [
      {
        name: isCbse ? `${data.classLevel} ${data.stream}` : `${data.educationSystem} ${data.stream}`,
        confidence: 0.9,
        reason: "Demo academic profile created from your selected board, degree, class, semester, and stream.",
        source: "StudyMind demo data",
      },
      {
        name: isCbse ? "NCERT and CBSE Curriculum" : `${data.university || "University"} syllabus map`,
        confidence: 0.82,
        reason: "Starter source preference added for syllabus-aware planning.",
        source: "StudyMind demo data",
      },
    ],
    suggested_next_subjects: data.currentSubjects.length ? data.currentSubjects : ["Mathematics", "Science", "Programming"],
    notebook_needs: ["Weekly revision notebook", "Formula and definitions notebook", "Mistake log"],
    study_material_needs: data.weakAreas.length ? data.weakAreas : ["Diagnostic quiz practice"],
    starter_material_sources: [
      {
        title: isCbse ? "NCERT Textbooks" : "VTU B.E. Scheme Syllabus",
        url: isCbse ? "https://ncert.nic.in/textbook.php" : "https://vtu.ac.in/b-e-scheme-syllabus/",
        notes: isCbse ? "Official NCERT textbook source for CBSE-aligned learning." : "Official VTU syllabus source for semester mapping.",
        provider: isCbse ? "NCERT" : "VTU",
        relevance: 0.92,
      },
      {
        title: isCbse ? "CBSE Academic Curriculum" : "VTUCircle Notes and Papers",
        url: isCbse ? "https://cbseacademic.nic.in/curriculum_2026.html" : "https://www.vtucircle.com/",
        notes: isCbse ? "CBSE curriculum and academic resources." : "Community notes and previous-year paper source for VTU students.",
        provider: isCbse ? "CBSE" : "VTUCircle",
        relevance: 0.84,
      },
    ],
    next_step: "Take a diagnostic quiz or upload a chapter PDF.",
  };
}

function demoMaterialSearch(data: OnboardingData): MaterialSearchResult {
  const profile = demoOnboardingResult(data);
  return {
    results: profile.starter_material_sources,
    search_queries: [
      `${data.educationSystem} ${data.classLevel} ${data.stream} syllabus`,
      `${data.currentSubjects[0] || data.stream} study material`,
    ],
    note: "Demo mode uses safe starter links. Real signup can call the backend material search.",
  };
}

function chipButton(active: boolean) {
  return `py-2 px-4 rounded-full border transition-all duration-300 text-sm ${
    active
      ? "bg-neonCyan/20 border-neonCyan text-white shadow-[0_0_10px_rgba(0,209,255,0.3)]"
      : "bg-transparent border-white/20 text-white/60 hover:border-white/40 hover:text-white"
  }`;
}

export default function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const isSchool = ["CBSE", "ICSE / ISC", "State Board"].includes(data.educationSystem);
  const isDegree = ["B.E. / B.Tech", "B.Sc", "BCA", "B.Com", "BBA", "B.A.", "M.E. / M.Tech", "M.Sc", "MCA", "MBA", "Diploma"].includes(data.educationSystem);
  const classOptions = isSchool ? CBSE_CLASSES : isDegree ? DEGREE_SEMESTERS : ["Current Level"];
  const streamOptions = useMemo(() => {
    if (isDegree) return DEGREE_STREAMS;
    if (isSchool) return CBSE_STREAMS;
    return ["General"];
  }, [data.educationSystem, isDegree, isSchool]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 5));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const toggleArrayItem = (field: keyof OnboardingData, item: string) => {
    setData((prev) => {
      const arr = prev[field] as string[];
      return arr.includes(item)
        ? { ...prev, [field]: arr.filter((i) => i !== item) }
        : { ...prev, [field]: [...arr, item] };
    });
  };

  const handleEducationChange = (educationSystem: string) => {
    setData((prev) => ({
      ...prev,
      educationSystem,
      classLevel: ["CBSE", "ICSE / ISC", "State Board"].includes(educationSystem) ? "Class 10" : educationSystem === "Other" ? "Current Level" : "Semester 6",
      stream: ["CBSE", "ICSE / ISC", "State Board"].includes(educationSystem) ? "Science" : educationSystem === "Other" ? "General" : "Computer Science / CSE",
      targetExam: educationSystem === "CBSE" ? "CBSE board exams" : educationSystem === "B.E. / B.Tech" ? "semester exams and placements" : prev.targetExam,
      university: educationSystem === "B.E. / B.Tech" ? "VTU" : "",
      materialSources: educationSystem === "CBSE" ? ["CBSE curriculum", "NCERT"] : ["previous-year papers later", "college notes later"],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    const appMode = localStorage.getItem("studymind:mode") || "signup";
    const savedRealUserId = localStorage.getItem("studymind:user_id");
    const realUserId = savedRealUserId || `student-${crypto.randomUUID().slice(0, 8)}`;
    if (appMode !== "demo" && !savedRealUserId) {
      localStorage.setItem("studymind:user_id", realUserId);
    }

    const payload = {
      user_id: appMode === "demo" ? "demo-user" : realUserId,
      name: data.name || (appMode === "demo" ? "Demo Student" : "StudyMind Student"),
      grade_level: `${data.educationSystem} ${data.university ? `under ${data.university}` : ""} ${data.classLevel}`,
      target_exam: data.targetExam,
      current_subjects: [data.educationSystem, data.university, data.classLevel, data.stream, ...data.currentSubjects].filter(Boolean),
      goals: [data.targetExam, data.stream],
      weak_areas: data.weakAreas,
      strong_areas: data.strongAreas,
      preferred_learning_style: data.learningStyle,
      weekly_hours: data.weeklyHours,
      wants_notebooks: Boolean(data.wantNotebooks),
      wants_study_materials: Boolean(data.wantMaterialsLater),
      material_sources: data.materialSources,
    };

    try {
      if (appMode === "demo") {
        localStorage.setItem("studymind:onboarding", JSON.stringify(demoOnboardingResult(data)));
        localStorage.setItem("studymind:materials", JSON.stringify(demoMaterialSearch(data)));
        router.push("/onboarding/overview");
        return;
      }

      const onboarding = await apiFetch<BackendOnboardingResult>("/api/v1/onboarding/survey", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const materialSearch = await apiFetch<MaterialSearchResult>("/api/v1/materials/search", {
        method: "POST",
        body: JSON.stringify({
          education_system: `${data.university ? `${data.university} ` : ""}${data.educationSystem}`,
          class_level: data.classLevel,
          stream: data.stream,
          subject: data.currentSubjects[0] || data.stream,
          topic: data.weakAreas[0] || "",
          limit: 10,
        }),
      });

      localStorage.setItem("studymind:onboarding", JSON.stringify(onboarding));
      localStorage.setItem("studymind:materials", JSON.stringify(materialSearch));
      localStorage.setItem(onboardingCompleteKey(realUserId), "true");
      router.push("/onboarding/overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit onboarding survey.");
      setIsSubmitting(false);
    }
  };

  const subjectOptions = useMemo(() => {
    if (isSchool && ["Class 11", "Class 12"].includes(data.classLevel)) {
      if (data.stream === "Commerce") return ["Accountancy", "Business Studies", "Economics", "Applied Mathematics", "Entrepreneurship"];
      if (data.stream === "Humanities") return ["History", "Political Science", "Geography", "Psychology", "Sociology"];
      return ["Physics", "Chemistry", "Mathematics", "Biology", "Computer Science"];
    }
    if (isSchool) return ["English", "Hindi", "Mathematics", "Science", "Social Science", "Computer Applications"];
    if (["B.Com", "BBA", "MBA"].includes(data.educationSystem)) return ["Accountancy", "Economics", "Business Studies", "Finance", "Marketing", "Analytics"];
    if (["B.A."].includes(data.educationSystem)) return ["History", "Political Science", "Economics", "Psychology", "Sociology", "English"];
    return ["Data Structures", "Operating Systems", "DBMS", "Computer Networks", "Machine Learning", "Cloud Computing", "Compiler Design", "DevOps"];
  }, [data.educationSystem, data.classLevel, data.stream, isSchool]);

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <BrainCircuit className="w-12 h-12 text-neonCyan mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Initialize Academic Map</h2>
              <p className="text-white/50">Start with your Indian academic context: board, degree, university, semester, and stream.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">What should we call you?</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-xl text-white placeholder-white/20 focus:outline-none focus:border-neonCyan/50 focus:ring-1 focus:ring-neonCyan/50 transition-all"
                  placeholder="Your name"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Board / Degree</label>
                  <select value={data.educationSystem} onChange={(e) => handleEducationChange(e.target.value)} className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neonCyan/50">
                    {EDUCATION_OPTIONS.map((option) => <option key={option} className="text-gray-900">{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Class / Semester</label>
                  <select value={data.classLevel} onChange={(e) => setData({ ...data, classLevel: e.target.value })} className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neonCyan/50">
                    {classOptions.map((option) => <option key={option} className="text-gray-900">{option}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Stream / Domain</label>
                  <select value={data.stream} onChange={(e) => setData({ ...data, stream: e.target.value })} className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neonCyan/50">
                    {streamOptions.map((option) => <option key={option} className="text-gray-900">{option}</option>)}
                  </select>
                </div>
              </div>
              {isDegree && (
                <div>
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">University / Affiliation</label>
                  <input
                    value={data.university}
                    onChange={(e) => setData({ ...data, university: e.target.value })}
                    className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-neonCyan/50"
                    placeholder="VTU, Bangalore University, autonomous college..."
                  />
                </div>
              )}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Target className="w-12 h-12 text-electricViolet mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">The Horizon</h2>
              <p className="text-white/50">Choose goals and subjects so StudyMind can detect the right syllabus domain.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1">Target Exam / Goal</label>
                <input
                  value={data.targetExam}
                  onChange={(e) => setData({ ...data, targetExam: e.target.value })}
                  className="w-full mt-2 bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-electricViolet/50"
                  placeholder="CBSE board exam, VTU semester exams, placements..."
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1 mb-3 block">Current Subjects</label>
                <div className="flex flex-wrap gap-2">
                  {subjectOptions.map((subject) => (
                    <button key={subject} type="button" onClick={() => toggleArrayItem("currentSubjects", subject)} className={chipButton(data.currentSubjects.includes(subject))}>
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Lightbulb className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Calibration</h2>
              <p className="text-white/50">Tell the engine where you are strong and where you need recovery.</p>
            </div>
            <div className="space-y-8">
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1 mb-3 block">Strong Areas</label>
                <div className="flex flex-wrap gap-2">
                  {data.currentSubjects.map((subject) => (
                    <button key={subject} type="button" onClick={() => toggleArrayItem("strongAreas", subject)} className={`py-2 px-4 rounded-xl border transition-all text-sm ${data.strongAreas.includes(subject) ? "bg-green-500/20 border-green-500 text-white" : "bg-white/5 border-white/10 text-white/60"}`}>
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1 mb-3 block">Weak Areas</label>
                <div className="flex flex-wrap gap-2">
                  {data.currentSubjects.map((subject) => (
                    <button key={subject} type="button" onClick={() => toggleArrayItem("weakAreas", subject)} className={`py-2 px-4 rounded-xl border transition-all text-sm ${data.weakAreas.includes(subject) ? "bg-red-500/20 border-red-500 text-white" : "bg-white/5 border-white/10 text-white/60"}`}>
                      {subject}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <Clock className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Learning Matrix</h2>
              <p className="text-white/50">Tune the plan around your style and weekly study bandwidth.</p>
            </div>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {LEARNING_STYLES.map((style) => (
                  <button key={style.id} type="button" onClick={() => setData({ ...data, learningStyle: style.id })} className={`p-4 rounded-xl border transition-all text-left ${data.learningStyle === style.id ? "bg-blue-500/20 border-blue-500 text-white" : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"}`}>
                    <span className="font-medium text-sm block">{style.label}</span>
                  </button>
                ))}
              </div>
              <div>
                <div className="flex justify-between items-end mb-3 ml-1">
                  <label className="text-xs font-medium text-white/50 uppercase tracking-wider block">Weekly Study Hours</label>
                  <span className="text-2xl font-bold text-neonCyan">{data.weeklyHours} hrs</span>
                </div>
                <input type="range" min="1" max="40" value={data.weeklyHours} onChange={(e) => setData({ ...data, weeklyHours: parseInt(e.target.value) })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neonCyan" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <BookOpen className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Material Loadout</h2>
              <p className="text-white/50">Pick official sources StudyMind should prepare first.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-panel p-5 rounded-xl border-white/10">
                <label className="text-sm font-medium text-white block mb-4">Generate personalized notebooks?</label>
                <div className="flex gap-2">
                  {[true, false].map((value) => (
                    <button key={String(value)} type="button" onClick={() => setData({ ...data, wantNotebooks: value })} className={`flex-1 py-2 rounded-lg border transition-all ${data.wantNotebooks === value ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "border-white/10 text-white/50 hover:bg-white/5"}`}>
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="glass-panel p-5 rounded-xl border-white/10">
                <label className="text-sm font-medium text-white block mb-4">Pull study materials later?</label>
                <div className="flex gap-2">
                  {[true, false].map((value) => (
                    <button key={String(value)} type="button" onClick={() => setData({ ...data, wantMaterialsLater: value })} className={`flex-1 py-2 rounded-lg border transition-all ${data.wantMaterialsLater === value ? "bg-emerald-500/20 border-emerald-500 text-emerald-300" : "border-white/10 text-white/50 hover:bg-white/5"}`}>
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-white/50 uppercase tracking-wider ml-1 mb-3 block">Preferred Sources</label>
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map((source) => (
                  <button key={source} type="button" onClick={() => toggleArrayItem("materialSources", source)} className={chipButton(data.materialSources.includes(source))}>
                    {source}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-deepSpace flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-electricViolet/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-neonCyan/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="w-full h-1 bg-white/5 absolute top-0 left-0">
        <motion.div className="h-full bg-gradient-to-r from-neonCyan to-electricViolet" animate={{ width: `${(step / 5) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }} />
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="glass-panel p-8 md:p-12 rounded-3xl border-white/10 shadow-2xl relative">
              {isSubmitting ? (
                <div className="py-20 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full border-4 border-white/10 border-t-neonCyan animate-spin mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-2">Compiling Academic Profile...</h3>
                  <p className="text-neonCyan animate-pulse">Fetching syllabus-aware sources</p>
                </div>
              ) : (
                <>
                  {renderStepContent()}
                  {error && <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
                  <div className="mt-12 flex items-center justify-between pt-6 border-t border-white/10">
                    <button onClick={handlePrev} disabled={step === 1} className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${step === 1 ? "opacity-0 pointer-events-none" : "text-white/60 hover:text-white hover:bg-white/5"}`}>
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </button>
                    {step < 5 ? (
                      <button onClick={handleNext} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-all">
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={handleSubmit} className="flex items-center gap-2 px-8 py-3 rounded-xl bg-neonCyan text-deepSpace font-bold hover:bg-white hover:shadow-[0_0_20px_rgba(0,209,255,0.4)] transition-all">
                        Complete Profile
                        <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
