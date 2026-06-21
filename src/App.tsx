import { useState } from "react";
import Landing from "./components/Landing";
import AnalysisInput from "./components/AnalysisInput";
import Processing from "./components/Processing";
import Results from "./components/Results";
import { AnalysisResult } from "./types";
import { Sparkles } from "lucide-react";
import logoLight from "./assets/roleva_logo_light.svg";

export default function App() {
  const [step, setStep] = useState<"landing" | "input" | "processing" | "results">("landing");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [globalError, setGlobalError] = useState("");

  const [masterResume, setMasterResume] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("roleva_master_resume");
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });

  const [masterResumeFileName, setMasterResumeFileName] = useState<string | null>(() => {
    return localStorage.getItem("roleva_master_resume_filename") || null;
  });

  const [history, setHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("roleva_analysis_history");
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  const saveMasterResume = (resume: any, fileName: string) => {
    setMasterResume(resume);
    setMasterResumeFileName(fileName);
    localStorage.setItem("roleva_master_resume", JSON.stringify(resume));
    localStorage.setItem("roleva_master_resume_filename", fileName);
  };

  const clearMasterResume = () => {
    setMasterResume(null);
    setMasterResumeFileName(null);
    localStorage.removeItem("roleva_master_resume");
    localStorage.removeItem("roleva_master_resume_filename");
    setResults(null);
  };

  const addToHistory = (
    jobTitle: string,
    companyName: string,
    resume: any,
    jobDesc: string,
    level: string,
    style: string,
    analysisRes: any
  ) => {
    const newId = `hist_${Date.now()}`;
    const newItem = {
      id: newId,
      title: jobTitle,
      company: companyName,
      timestamp: new Date().toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      structuredResume: resume,
      jobDescription: jobDesc,
      careerLevel: level,
      writingStyle: style,
      results: analysisRes
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem("roleva_analysis_history", JSON.stringify(updatedHistory));
  };

  const handleLoadHistoryItem = (item: any) => {
    setResults(item.results);
    setStep("results");
  };

  const handleAnalyzeNewJob = () => {
    setResults(null);
    setGlobalError("");
    setStep("input");
  };

  const handleUploadNewCV = () => {
    setMasterResume(null);
    setMasterResumeFileName(null);
    setHistory([]);
    setResults(null);
    setGlobalError("");
    localStorage.removeItem("roleva_master_resume");
    localStorage.removeItem("roleva_master_resume_filename");
    localStorage.removeItem("roleva_analysis_history");
    setStep("input");
  };

  const handleStartAnalysis = async (
    structuredResume: any,
    jobDescription: string,
    careerLevel: string,
    writingStyle: string
  ) => {
    setGlobalError("");
    setStep("processing");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          structuredResume,
          jobDescription,
          careerLevel,
          writingStyle
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data: AnalysisResult = await response.json();
      setResults(data);

      // Save custom/final resume as master, or update it
      saveMasterResume(structuredResume, masterResumeFileName || "custom_resume.docx");

      // Add to History
      const title = data.extractedJobTitle || "Product Designer";
      const company = data.extractedCompanyName || "Innovative Company";
      addToHistory(title, company, structuredResume, jobDescription, careerLevel, writingStyle, data);

      setStep("results");
    } catch (error: any) {
      console.error("Resume Analysis Error:", error);
      setGlobalError(error.message || "An unexpected error occurred during resume optimization.");
      setStep("input");
    }
  };

  const handleReset = () => {
    setResults(null);
    setGlobalError("");
    setStep("input");
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#fafbfe] text-slate-800 font-sans flex flex-col justify-between selection:bg-blue-150 selection:text-blue-900">
      
      {/* Platform Header Panel */}
      {step !== "landing" && (
        <nav id="app-nav" className="bg-white/80 backdrop-blur-md border-b border-slate-100 py-3.5 px-6 sticky top-0 z-40 print:hidden shadow-xs">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={handleReset}>
              <img src={logoLight} alt="Roleva Logo" className="h-7.5 w-auto object-contain" referrerPolicy="no-referrer" />
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-xs font-mono font-bold text-slate-400 bg-slate-50 border border-slate-150/40 px-2 py-0.5 rounded">
                v1.1.0 Workspace
              </span>
              <button
                onClick={handleReset}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all"
              >
                Reset Space
              </button>
            </div>
          </div>
        </nav>
      )}

      {/* Steps Content Area */}
      <div className="flex-grow">
        
        {/* Render visual validation errors if any */}
        {globalError && step === "input" && (
          <div className="max-w-6xl mx-auto px-6 pt-6">
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-250 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5 shadow-sm">
              <span className="p-1 rounded bg-rose-500 text-white text-[9px] font-mono tracking-wider font-extrabold flex-shrink-0">
                SYSTEM CORRECTION
              </span>
              <p className="font-semibold leading-relaxed">
                Analysis halted: {globalError}
              </p>
            </div>
          </div>
        )}

        {step === "landing" && (
          <Landing 
            onStart={() => setStep("input")} 
            historyList={history}
            onLoadHistoryItem={handleLoadHistoryItem}
          />
        )}

        {step === "input" && (
          <AnalysisInput 
            onAnalyze={handleStartAnalysis}
            masterResume={masterResume}
            masterResumeFileName={masterResumeFileName}
            onSaveMasterResume={saveMasterResume}
            onClearMasterResume={clearMasterResume}
            historyList={history}
            onLoadHistoryItem={handleLoadHistoryItem}
          />
        )}

        {step === "processing" && (
          <Processing />
        )}

        {step === "results" && results && (
          <Results 
            data={results} 
            onReset={handleReset} 
            onAnalyzeNewJob={handleAnalyzeNewJob}
            onUploadNewCV={handleUploadNewCV}
            masterResumeFileName={masterResumeFileName}
            historyList={history}
            onLoadHistoryItem={handleLoadHistoryItem}
          />
        )}

      </div>

      {/* Floating System Credit Footnote (Kept minimalist) */}
      <footer id="app-footer" className="bg-slate-50 border-t border-slate-100 py-4 px-6 text-center text-xs text-slate-400 font-sans print:hidden">
        <p>Powered by Google Gemini 3.5 Flash & Tailwind platform. Ingested profiles are treated with absolute transient privacy.</p>
      </footer>

    </div>
  );
}
