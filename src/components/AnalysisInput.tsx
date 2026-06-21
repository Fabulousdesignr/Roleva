import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  FileText, 
  ChevronRight, 
  File, 
  AlertCircle, 
  Sliders, 
  Check, 
  Plus, 
  Trash2, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  Award, 
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface AnalysisInputProps {
  onAnalyze: (
    structuredResume: any,
    jobDescription: string,
    careerLevel: string,
    writingStyle: string
  ) => void;
  masterResume: any | null;
  masterResumeFileName: string | null;
  onSaveMasterResume: (resume: any, fileName: string) => void;
  onClearMasterResume: () => void;
  historyList: any[];
  onLoadHistoryItem: (item: any) => void;
}

interface Experience {
  role: string;
  company: string;
  duration: string;
  bulletPoints: string[];
}

interface Education {
  degree: string;
  school: string;
  year: string;
}

interface ProfileData {
  name: string;
  contactInfo: string;
  summary: string;
  skills: string[];
  experiences: Experience[];
  education: Education[];
  certifications: string[];
}

export default function AnalysisInput({
  onAnalyze,
  masterResume,
  masterResumeFileName,
  onSaveMasterResume,
  onClearMasterResume,
  historyList,
  onLoadHistoryItem
}: AnalysisInputProps) {
  // Wizard state: Step 1 (Upload), Step 2 (Review Profile), Step 3 (Target Settings)
  const [subStep, setSubStep] = useState<1 | 2 | 3>(() => {
    return masterResume ? 3 : 1;
  });
  const [dragActive, setDragActive] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data starts with masterResume if present
  const [profileData, setProfileData] = useState<ProfileData>(() => {
    if (masterResume) {
      return {
        name: masterResume.name || "",
        contactInfo: masterResume.contactInfo || "",
        summary: masterResume.summary || "",
        skills: Array.isArray(masterResume.skills) ? masterResume.skills : [],
        experiences: Array.isArray(masterResume.experiences) ? masterResume.experiences : [],
        education: Array.isArray(masterResume.education) ? masterResume.education : [],
        certifications: Array.isArray(masterResume.certifications) ? masterResume.certifications : []
      };
    }
    return {
      name: "",
      contactInfo: "",
      summary: "",
      skills: [],
      experiences: [],
      education: [],
      certifications: []
    };
  });

  const [skillsText, setSkillsText] = useState(() => {
    return masterResume && Array.isArray(masterResume.skills) ? masterResume.skills.join(", ") : "";
  });
  const [certsText, setCertsText] = useState(() => {
    return masterResume && Array.isArray(masterResume.certifications) ? masterResume.certifications.join(", ") : "";
  });

  const handleReplaceResume = () => {
    onClearMasterResume();
    setProfileData({
      name: "",
      contactInfo: "",
      summary: "",
      skills: [],
      experiences: [],
      education: [],
      certifications: []
    });
    setSkillsText("");
    setCertsText("");
    setSubStep(1);
  };

  const handleViewResumeData = () => {
    setSubStep(2);
  };

  // Step 3 Job Targeting Inputs
  const [jobDescription, setJobDescription] = useState("");
  const [careerLevel, setCareerLevel] = useState<string>("Mid-Level (3–5 years)");
  const [writingStyle, setWritingStyle] = useState<string>("Balanced");

  // Keep manual text fields in sync with profileData arrays when loaded from backing state
  useEffect(() => {
    if (profileData.skills.length > 0 && !skillsText) {
      setSkillsText(profileData.skills.join(", "));
    }
    if (profileData.certifications.length > 0 && !certsText) {
      setCertsText(profileData.certifications.join(", "));
    }
  }, [profileData.skills, profileData.certifications]);

  // Drag and Drop handlers
  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setErrorMsg("");
    setIsExtracting(true);

    try {
      const fileName = file.name;
      const fileExtension = fileName.split(".").pop()?.toLowerCase();

      // Let's check for PDF uploads early
      if (fileExtension === "pdf") {
        setIsExtracting(false);
        setErrorMsg("PDF uploads are temporarily unavailable in this version. Please upload a DOC/DOCX file or paste your CV text.");
        return;
      }

      let mimeType = file.type;

      // Fix empty mime fallback
      if (!mimeType) {
        if (fileExtension === "docx" || fileExtension === "doc") {
          mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        } else {
          mimeType = "text/plain";
        }
      }

      if (fileExtension !== "docx" && fileExtension !== "doc" && fileExtension !== "txt" && fileExtension !== "md") {
        setIsExtracting(false);
        setErrorMsg("Roleva currently supports DOC and DOCX documents as the primary inputs. Please upload a structured file.");
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const resultString = e.target?.result as string;
          const base64Data = resultString.split(",")[1];

          const response = await fetch("/api/extract", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileData: base64Data,
              mimeType: mimeType,
              fileName: fileName
            })
          });

          if (!response.ok) {
            const errJson = await response.json().catch(() => ({}));
            throw new Error(errJson.error || `Server extraction failed with status ${response.status}`);
          }

          const parsedObj = await response.json();
          const cleanProfile: ProfileData = {
            name: parsedObj.name || "",
            contactInfo: parsedObj.contactInfo || "",
            summary: parsedObj.summary || "",
            skills: Array.isArray(parsedObj.skills) ? parsedObj.skills : [],
            experiences: Array.isArray(parsedObj.experiences) ? parsedObj.experiences : [],
            education: Array.isArray(parsedObj.education) ? parsedObj.education : [],
            certifications: Array.isArray(parsedObj.certifications) ? parsedObj.certifications : []
          };

          setProfileData(cleanProfile);
          setSkillsText(cleanProfile.skills.join(", "));
          setCertsText(cleanProfile.certifications.join(", "));
          
          onSaveMasterResume(cleanProfile, fileName);
          setSubStep(2); // Jump to interactive manual editing
        } catch (innerErr: any) {
          setErrorMsg(innerErr?.message || "Could not successfully extract resume features. Please try another file or start with a blank state.");
        } finally {
          setIsExtracting(false);
        }
      };

      reader.onerror = () => {
        setIsExtracting(false);
        setErrorMsg("Failed reading local filesystem bytes.");
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsExtracting(false);
      setErrorMsg(err?.message || "Encountered unexpected parsing failure.");
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerSearchFile = () => {
    fileInputRef.current?.click();
  };

  const handleStartBlank = () => {
    setErrorMsg("");
    const blankProfile = {
      name: "",
      contactInfo: "",
      summary: "",
      skills: [],
      experiences: [
        { role: "", company: "", duration: "", bulletPoints: [""] }
      ],
      education: [
        { degree: "", school: "", year: "" }
      ],
      certifications: []
    };
    setProfileData(blankProfile);
    setSkillsText("");
    setCertsText("");
    onSaveMasterResume(blankProfile, "Manual Profile");
    setSubStep(2);
  };

  // State mutators for dynamic editable elements in Step 2:
  const updateExperience = (idx: number, field: keyof Experience, val: any) => {
    const updated = [...profileData.experiences];
    updated[idx] = { ...updated[idx], [field]: val };
    setProfileData({ ...profileData, experiences: updated });
  };

  const updateExperienceBullet = (expIdx: number, bulletIdx: number, val: string) => {
    const updated = [...profileData.experiences];
    const updatedBullets = [...updated[expIdx].bulletPoints];
    updatedBullets[bulletIdx] = val;
    updated[expIdx] = { ...updated[expIdx], bulletPoints: updatedBullets };
    setProfileData({ ...profileData, experiences: updated });
  };

  const addExperienceBullet = (expIdx: number) => {
    const updated = [...profileData.experiences];
    updated[expIdx] = {
      ...updated[expIdx],
      bulletPoints: [...updated[expIdx].bulletPoints, ""]
    };
    setProfileData({ ...profileData, experiences: updated });
  };

  const removeExperienceBullet = (expIdx: number, bulletIdx: number) => {
    const updated = [...profileData.experiences];
    const filteredBullets = updated[expIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
    updated[expIdx] = { ...updated[expIdx], bulletPoints: filteredBullets };
    setProfileData({ ...profileData, experiences: updated });
  };

  const addNewExperience = () => {
    setProfileData({
      ...profileData,
      experiences: [
        ...profileData.experiences,
        { role: "", company: "", duration: "", bulletPoints: [""] }
      ]
    });
  };

  const deleteExperience = (idx: number) => {
    const filtered = profileData.experiences.filter((_, i) => i !== idx);
    setProfileData({ ...profileData, experiences: filtered });
  };

  const updateEducation = (idx: number, field: keyof Education, val: string) => {
    const updated = [...profileData.education];
    updated[idx] = { ...updated[idx], [field]: val };
    setProfileData({ ...profileData, education: updated });
  };

  const addNewEducation = () => {
    setProfileData({
      ...profileData,
      education: [
        ...profileData.education,
        { degree: "", school: "", year: "" }
      ]
    });
  };

  const deleteEducation = (idx: number) => {
    const filtered = profileData.education.filter((_, i) => i !== idx);
    setProfileData({ ...profileData, education: filtered });
  };

  // Proceed to Step 3 validations
  const handleProceedToTargeting = () => {
    setErrorMsg("");
    if (!profileData.name.trim()) {
      setErrorMsg("Candidate Full Name is required to proceed.");
      return;
    }
    if (!profileData.summary.trim()) {
      setErrorMsg("Please write or verify a brief Professional Summary.");
      return;
    }

    const compiledSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const compiledCerts = certsText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const assembledStructuredResume = {
      ...profileData,
      skills: compiledSkills,
      certifications: compiledCerts
    };

    onSaveMasterResume(assembledStructuredResume, masterResumeFileName || "custom_resume.pdf");
    setSubStep(3);
  };

  // Fire Final Analysis
  const handleFinalSubmit = () => {
    setErrorMsg("");
    if (!jobDescription.trim()) {
      setErrorMsg("Please paste a target Job Description to calibrate AI optimization boundaries.");
      return;
    }

    const compiledSkills = skillsText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const compiledCerts = certsText
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const assembledStructuredResume = {
      ...profileData,
      skills: compiledSkills,
      certifications: compiledCerts
    };

    onSaveMasterResume(assembledStructuredResume, masterResumeFileName || "custom_resume.pdf");
    onAnalyze(assembledStructuredResume, jobDescription, careerLevel, writingStyle);
  };

  return (
    <div id="roleva-onboarding-wrapper" className="max-w-6xl mx-auto px-6 py-10 font-sans">
      
      {/* Active Resume / Workspace Status Badge */}
      {masterResume && (
        <div className="max-w-4xl mx-auto mb-8 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-indigo-50/50 border border-blue-100 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 first-letter:text-white rounded-xl shadow-xs text-white">
              <File className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                  Active Workspace Resume
                </span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-sm font-black text-slate-800 leading-tight mt-1">
                {masterResumeFileName || "Master Resume.pdf"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handleViewResumeData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-3xs"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              View Resume Data
            </button>
            <button
              onClick={handleReplaceResume}
              className="px-3 py-1.5 rounded-xl border border-rose-100 bg-white hover:bg-rose-50 text-rose-600 font-bold text-xs cursor-pointer transition-all inline-flex items-center gap-1.5 shadow-3xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              Replace Resume
            </button>
          </div>
        </div>
      )}
      
      {/* 3-Step Progress Tracker Header */}
      <div className="max-w-3xl mx-auto mb-10 print:hidden">
        <div className="flex items-center justify-between relative px-2">
          {/* Background line */}
          <div className="absolute left-0 right-0 h-[3px] bg-slate-200/80 top-1/2 -translate-y-1/2 z-0" />
          {/* Active progress color */}
          <div 
            className="absolute left-0 h-[3px] bg-gradient-to-r from-blue-600 to-indigo-600 top-1/2 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((subStep - 1) / 2) * 100}%` }}
          />
          
          {[
            { id: 1, name: "Upload", desc: "DOC or DOCX ingest" },
            { id: 2, name: "Review", desc: "Verify extracted profile" },
            { id: 3, name: "Targeting", desc: "Define job & style" }
          ].map((s) => {
            const isCompleted = subStep > s.id;
            const isActive = subStep === s.id;
            return (
              <div key={s.id} className="relative z-10 flex flex-col items-center">
                <button
                  onClick={() => {
                    if (s.id < subStep || (s.id === 2 && profileData.name)) {
                      setSubStep(s.id as 1 | 2 | 3);
                    }
                  }}
                  disabled={s.id > subStep && !profileData.name}
                  className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm border-2 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "bg-white border-blue-600 text-blue-600 shadow-md shadow-blue-500/10 scale-110 font-extrabold ring-4 ring-blue-50"
                      : isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : s.id}
                </button>
                <span className={`text-[11.5px] font-extrabold mt-2 tracking-tight ${isActive ? "text-blue-600" : "text-slate-500"}`}>
                  {s.name}
                </span>
                <span className="text-[9.5px] text-slate-400 leading-none mt-0.5 hidden sm:inline">{s.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        
        {/* Loading / Extraction Spinner View */}
        {isExtracting && (
          <motion.div
            key="parsing-spinner"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-xl max-w-xl mx-auto my-12"
          >
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Roleva Parsing Engine Active
            </h3>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
              Using Gemini Multimodal AI to extract contact details, summary, structured job entries, skills indices, and academic degrees from your file.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 text-xs font-mono font-bold text-slate-400 bg-slate-50 py-2 px-4 rounded-xl border border-slate-100">
              <Clock className="w-4 h-4 text-slate-400 animate-spin" />
              PROCESSING SECURE TRANSCRIPT...
            </div>
          </motion.div>
        )}

        {/* STEP 1: Upload Layout */}
        {!isExtracting && subStep === 1 && (
          <motion.div
            key="step-upload"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome to Roleva Resume Strategist
              </h2>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Upload your existing profile. Our intelligent parsing module instantly structure entries for manual calibration.
              </p>
            </div>

            <div
              id="roleva-drag-box"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerSearchFile}
              className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 bg-white shadow-sm ${
                dragActive
                  ? "border-blue-600 bg-blue-50/20"
                  : "border-slate-200 hover:border-blue-500 hover:bg-slate-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-150 shadow-xs mb-4">
                <Upload className="w-8 h-8" />
              </div>
              <p className="text-sm font-extrabold text-slate-800">
                Drag and drop your DOC or DOCX file here
              </p>
              <p className="text-xs text-slate-400 mt-2 max-w-md">
                Supported formats: DOC / DOCX / Paste Text (txt, md)
              </p>
              <button 
                type="button" 
                className="mt-5 text-xs font-bold text-blue-600 border border-blue-200 rounded-xl px-4 py-2 hover:bg-blue-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                Choose Local File
              </button>
            </div>

            <div className="flex items-center justify-center gap-4">
              <div className="h-px bg-slate-200 flex-grow" />
              <span className="text-xs font-mono font-bold text-slate-400">OR START FROM BLANK STATE</span>
              <div className="h-px bg-slate-200 flex-grow" />
            </div>

            <div className="text-center">
              <button
                id="btn-start-blank"
                onClick={handleStartBlank}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-slate-350 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
              >
                Start with a Free Blank State
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="font-semibold leading-relaxed">{errorMsg}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 2: Review Profile Layout */}
        {!isExtracting && subStep === 2 && (
          <motion.div
            key="step-review"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-blue-50 border border-blue-150 p-4 rounded-2xl flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-blue-900 uppercase">
                  Verify &amp; Refine Base Credentials
                </h4>
                <p className="text-[11px] text-blue-700 mt-1 leading-normal">
                  To achieve maximum candidate advantage, inspect the parsed details. Correct any scanning anomalies or append missing milestones manually below.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Profile Details Block */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Personal particulars input */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Personal particulars
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Alex Mercer"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Contact Info Details</label>
                      <input
                        type="text"
                        placeholder="e.g. alex@mercer.io | +1 555-0100 | City, ST"
                        value={profileData.contactInfo}
                        onChange={(e) => setProfileData({ ...profileData, contactInfo: e.target.value })}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Profile Summary statement */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Professional Summary
                  </label>
                  <textarea
                    value={profileData.summary}
                    onChange={(e) => setProfileData({ ...profileData, summary: e.target.value })}
                    className="w-full h-32 p-3 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 resize-y font-medium"
                    placeholder="Provide a solid professional statement of your history and skill parameters..."
                  />
                </div>

                {/* Skills indices & certifications */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-blue-500" />
                      Core Skills (comma separated)
                    </label>
                    <textarea
                      value={skillsText}
                      onChange={(e) => setSkillsText(e.target.value)}
                      className="w-full h-20 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 resize-y font-medium font-mono"
                      placeholder="e.g. Figma, Product Strategy, Wireframing, SQL"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-blue-500" />
                      Certifications (comma separated)
                    </label>
                    <textarea
                      value={certsText}
                      onChange={(e) => setCertsText(e.target.value)}
                      className="w-full h-16 p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 resize-y font-medium text-slate-600 font-mono"
                      placeholder="e.g. AWS Cloud Practitioner, Google PM, Scrum Master"
                    />
                  </div>
                </div>

              </div>

              {/* Work history & Educational block */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Work Experience dynamic form */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      Employment / Work History
                    </h3>
                    <button
                      type="button"
                      onClick={addNewExperience}
                      className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg bg-blue-50 font-sans border border-blue-200 text-blue-700 hover:bg-blue-105 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Role
                    </button>
                  </div>

                  {profileData.experiences.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No career work experience added yet. Click &quot;Add Role&quot; above to append milestones.
                    </div>
                  ) : (
                    <div className="space-y-6 divide-y divide-slate-100">
                      {profileData.experiences.map((exp, expIdx) => (
                        <div key={expIdx} className={`space-y-4 ${expIdx > 0 ? "pt-6" : ""}`}>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Company / Project Office</label>
                              <input
                                type="text"
                                value={exp.company}
                                onChange={(e) => updateExperience(expIdx, "company", e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                                placeholder="Company e.g. Acme Corp"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Role Title</label>
                              <input
                                type="text"
                                value={exp.role}
                                onChange={(e) => updateExperience(expIdx, "role", e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-semibold text-slate-800"
                                placeholder="e.g. Lead Engineer"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Duration / Tenure</label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={exp.duration}
                                  onChange={(e) => updateExperience(expIdx, "duration", e.target.value)}
                                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none font-mono text-slate-600"
                                  placeholder="e.g. 2021 - Present"
                                />
                                <button
                                  type="button"
                                  onClick={() => deleteExperience(expIdx)}
                                  className="p-2.5 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-red-650 cursor-pointer transition-all"
                                  title="Delete Role"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Role Accomplishment bullets block */}
                          <div className="bg-slate-50/50 p-4 border border-slate-200/60 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">
                                Bullet Achievements (Action + Scope + Outcome)
                              </label>
                              <button
                                type="button"
                                onClick={() => addExperienceBullet(expIdx)}
                                className="text-[9px] font-extrabold text-blue-600 hover:text-blue-800 flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" />
                                Add Bullet
                              </button>
                            </div>

                            {exp.bulletPoints.map((bullet, bIdx) => (
                              <div key={bIdx} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => updateExperienceBullet(expIdx, bIdx, e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Formulate: Action verb + project scope + quantitative metric/increase percentage outcome..."
                                />
                                <button
                                  type="button"
                                  onClick={() => removeExperienceBullet(expIdx, bIdx)}
                                  className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Remove Bullet"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Academic credentials dynamic form */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      Academic &amp; Education
                    </h3>
                    <button
                      type="button"
                      onClick={addNewEducation}
                      className="text-[10px] font-extrabold px-3 py-1.5 rounded-lg bg-blue-50 font-sans border border-blue-200 text-blue-700 hover:bg-blue-105 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add school
                    </button>
                  </div>

                  {profileData.education.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      No educational credentials added. Click &quot;Add school&quot; for academic details.
                    </div>
                  ) : (
                    <div className="space-y-4 divide-y divide-slate-100">
                      {profileData.education.map((edu, eduIdx) => (
                        <div key={eduIdx} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 items-end ${eduIdx > 0 ? "pt-4" : ""}`}>
                          
                          <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">University / school</label>
                            <input
                              type="text"
                              value={edu.school}
                              onChange={(e) => updateEducation(eduIdx, "school", e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                              placeholder="e.g. Stanford University"
                            />
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Degree Major</label>
                            <input
                              type="text"
                              value={edu.degree}
                              onChange={(e) => updateEducation(eduIdx, "degree", e.target.value)}
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none text-slate-800"
                              placeholder="e.g. B.S. Product Engineering"
                            />
                          </div>

                          <div className="sm:col-span-3 flex gap-2">
                            <div className="flex-grow">
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grad Year</label>
                              <input
                                type="text"
                                value={edu.year}
                                onChange={(e) => updateEducation(eduIdx, "year", e.target.value)}
                                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-mono"
                                placeholder="e.g. 2022"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteEducation(eduIdx)}
                              className="p-2.5 border border-red-200 hover:bg-red-50 hover:border-red-300 rounded-xl text-red-650 cursor-pointer transition-all self-end"
                              title="Delete Education"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>

            {errorMsg && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSubStep(1)}
                className="text-xs font-bold px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-650 cursor-pointer transition-all"
              >
                Back to Upload
              </button>
              <button
                type="button"
                onClick={handleProceedToTargeting}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md cursor-pointer transition-all flex items-center gap-1.5"
              >
                Proceed to Job Targeting
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </motion.div>
        )}

        {/* STEP 3: Job Targeting Layout */}
        {!isExtracting && subStep === 3 && (
          <motion.div
            key="step-targeting"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
          >
            {/* Main job desc inputs */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 uppercase">
                      Target Role Requirements
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Paste target job descriptions to formulate alignment metrics and style recommendations.
                    </p>
                  </div>
                  <span className="text-[10px] bg-red-50 border border-red-150 text-red-650 font-extrabold px-3 py-1 rounded-lg">
                    REQUIRED
                  </span>
                </div>

                <textarea
                  id="target-job-desc-textarea"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full h-80 p-4 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-1 focus:ring-blue-500 focus:outline-none focus:border-blue-500 resize-y leading-relaxed font-sans"
                  placeholder="Paste the target job details, company specifics, team credentials, requirements, and tech stack parameters here. Roleva analyzes skills and formats accordingly..."
                />
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setSubStep(2)}
                  className="text-xs font-bold px-4 py-2 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-650 cursor-pointer transition-all"
                >
                  Back to Profile
                </button>
                <button
                  id="btn-run-analysis"
                  onClick={handleFinalSubmit}
                  className="px-8 py-4.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-blue-500/10 cursor-pointer transition-all flex items-center gap-2 group transform active:scale-[0.99]"
                >
                  Analyze Resume
                  <Sparkles className="w-5 h-5 text-indigo-200 transition-transform group-hover:scale-110" />
                </button>
              </div>

            </div>

            {/* Calibration & Preference parameters sidebar */}
            <div className="lg:col-span-4 space-y-6">
              
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md space-y-6">
                
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-[12.5px] font-extrabold text-slate-900 uppercase">
                      Calibration Controls
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Configure AI writing posture and targeted leveling indicators.
                    </p>
                  </div>
                </div>

                {/* Level selection */}
                <div className="space-y-2.5">
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Career Level
                  </label>
                  <div className="space-y-1.5ClassName">
                    {[
                      { id: "Beginner (0–1 years)", label: "Beginner", sub: "0–1 years. Focuses on support & quick capacity." },
                      { id: "Junior (1–3 years)", label: "Junior", sub: "1–3 years. Executional execution & core contribution." },
                      { id: "Mid-Level (3–5 years)", label: "Mid-Level", sub: "3–5 years. Initiative ownership & metrics outcomes." },
                      { id: "Senior (5–8 years)", label: "Senior", sub: "5–8 years. Framing strategy, mentoring, frameworks." },
                      { id: "Lead (8+ years)", label: "Lead", sub: "8+ years. Scaling metrics, systemic organizational impact." }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCareerLevel(opt.id)}
                        className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all flex items-start gap-2 cursor-pointer ${
                          careerLevel === opt.id
                            ? "border-blue-500 bg-blue-50/30 font-semibold ring-1 ring-blue-500"
                            : "border-slate-150 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          careerLevel === opt.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {careerLevel === opt.id && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                        <div>
                          <div className={`font-bold ${careerLevel === opt.id ? "text-blue-900" : "text-slate-800"}`}>{opt.label}</div>
                          <div className="text-[9.5px] text-slate-400 leading-normal mt-0.5">{opt.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Writing style selection */}
                <div className="space-y-2.5 pt-4 border-t border-slate-100">
                  <label className="block text-[10.5px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Writing Tone Phrasing
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: "Conservative", label: "Conservative", sub: "Literal safely aligned terminology." },
                      { id: "Balanced", label: "Balanced", sub: "Highly recommended, metrics grounded." },
                      { id: "Competitive", label: "Competitive", sub: "High applicant leverage, persuasive posture." }
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setWritingStyle(opt.id)}
                        className={`w-full text-left p-2 rounded-xl border text-[11px] transition-all flex items-start gap-2 cursor-pointer ${
                          writingStyle === opt.id
                            ? "border-indigo-500 bg-indigo-50/30 font-semibold ring-1 ring-indigo-500"
                            : "border-slate-150 hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <div className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          writingStyle === opt.id ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300 bg-white"
                        }`}>
                          {writingStyle === opt.id && <Check className="w-2 h-2 stroke-[3]" />}
                        </div>
                        <div>
                          <div className={`font-bold ${writingStyle === opt.id ? "text-indigo-950" : "text-slate-800"}`}>{opt.label}</div>
                          <div className="text-[9.5px] text-slate-400 leading-normal mt-0.5">{opt.sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Previous Workspace Targets list */}
              {historyList && historyList.length > 0 && (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-md space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Clock className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
                    <div>
                      <h3 className="text-[12.5px] font-extrabold text-slate-900 uppercase">
                        Previous Workspace Targets
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                        Quick-restore previously tailored campaigns.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {historyList.map((hist) => (
                      <button
                        key={hist.id}
                        type="button"
                        onClick={() => onLoadHistoryItem(hist)}
                        className="w-full text-left p-3.5 rounded-xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex flex-col gap-1 text-slate-700 bg-white shadow-3xs"
                      >
                        <div className="flex items-center justify-between gap-1.5 font-sans">
                          <span className="text-[11px] font-extrabold text-blue-600 truncate flex-1">
                            {hist.title}
                          </span>
                          <span className="text-[9px] text-slate-450 font-bold shrink-0">
                            {hist.results?.matchScore}% Fit
                          </span>
                        </div>
                        <p className="text-[11px] font-bold text-slate-800 line-clamp-1 leading-normal font-sans">
                          @ {hist.company}
                        </p>
                        <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-slate-50 font-mono text-[9px] text-slate-400">
                          <span>{hist.timestamp}</span>
                          <span className="text-blue-600 font-bold text-[8.5px]">View Kit →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
