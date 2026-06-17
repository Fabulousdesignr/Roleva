import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle2, AlertCircle, Copy, Check, RotateCcw, Sparkles, 
  Printer, Star, ArrowRight, Rocket, Building2, Palette, FileText, 
  Edit2, Eye, Download, Info, Plus, Trash2, ChevronDown, ChevronUp, Award, Briefcase, GraduationCap,
  Upload, File
} from "lucide-react";
import { AnalysisResult, CompanyPersonality, ResumeStructure, ResumeSectionExperience, ResumeSectionProject, ResumeEducation } from "../types";

interface ResultsProps {
  data: AnalysisResult;
  onReset: () => void;
  onAnalyzeNewJob: () => void;
  onUploadNewCV: () => void;
  masterResumeFileName: string | null;
  historyList: any[];
  onLoadHistoryItem: (item: any) => void;
}

export default function Results({
  data,
  onReset,
  onAnalyzeNewJob,
  onUploadNewCV,
  masterResumeFileName,
  historyList,
  onLoadHistoryItem
}: ResultsProps) {
  // Main Tab controller: overview | resume | coverletter
  const [activeMainTab, setActiveMainTab] = useState<"overview" | "resume" | "coverletter">("overview");

  // Config template state: Classic (Georgia serif) or Modern (Inter sans-serif)
  const [selectedTemplate, setSelectedTemplate] = useState<"Classic" | "Modern">(() => {
    return data.recommendedTemplate === "Portfolio" ? "Modern" : "Classic";
  });
  
  const [copied, setCopied] = useState(false);
  const [alertVisible, setAlertVisible] = useState(true);
  const [isResumeEditing, setIsResumeEditing] = useState(false);
  const [isLetterEditing, setIsLetterEditing] = useState(false);

  // Editable structured resume state initialized with analysis output as first default
  const [resumeData, setResumeData] = useState<ResumeStructure>(() => {
    const raw = (data.tailoredResumeStructure || {}) as any;
    return {
      name: raw.name || "Candidate Name",
      contactInfo: raw.contactInfo || "candidate@email.com | +1 (555) 0100 | City, ST | linkedin.com/in/username",
      summary: raw.summary || "Results-driven professional with a proven track record of executing scalable strategies and coordinating cross-functional team initiatives.",
      experiences: raw.experiences || [],
      projects: raw.projects || [],
      skills: raw.skills || [],
      tools: raw.tools || [],
      certifications: raw.certifications || [],
      education: raw.education || []
    };
  });

  const [coverLetter, setCoverLetter] = useState<string>(() => {
    return data.coverLetterText || `Dear Hiring Team,\n\nI am writing to express my enthusiastic interest in the professional position details. With my core background and aligned achievements, I am confident in my ability to hit the ground running.\n\nThroughout my career, I have prioritized driving measurable impact and developing robust architectures. I look forward to the opportunity of discussing how my experience can empower your team.\n\nWarm regards,\n${resumeData.name}`;
  });

  // Copy plain text resume
  const handleCopyStructuredText = () => {
    const struct = resumeData;
    const plainText = `
${struct.name}
${struct.contactInfo}

PROFESSIONAL SUMMARY
${struct.summary}

SKILLS & COMPETENCIES
${struct.skills.join(", ")}

${struct.tools && struct.tools.length > 0 ? `TOOLS & TECHNOLOGIES\n${struct.tools.join(", ")}\n` : ""}
PROFESSIONAL EXPERIENCE
${struct.experiences.map(exp => `
${exp.role} - ${exp.company} (${exp.duration})
${exp.bulletPoints.map(b => `• ${b}`).join("\n")}`).join("\n")}

KEY PROJECTS
${struct.projects.map(proj => `
${proj.name} - ${proj.description}
${proj.bulletPoints.map(b => `• ${b}`).join("\n")}`).join("\n")}

${struct.certifications && struct.certifications.length > 0 ? `CERTIFICATIONS\n${struct.certifications.join(", ")}\n` : ""}
EDUCATION
${struct.education.map(edu => `${edu.degree} | ${edu.school} (${edu.year})`).join("\n")}
`;
    navigator.clipboard.writeText(plainText.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy cover letter text
  const handleCopyCoverLetterText = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Structured Field Handlers to support real-time editing
  const handleBasicChange = (field: keyof ResumeStructure, val: string) => {
    setResumeData(prev => ({ ...prev, [field]: val }));
  };

  const handleExperienceChange = (expIdx: number, field: keyof ResumeSectionExperience, val: any) => {
    setResumeData(prev => {
      const copy = [...prev.experiences];
      copy[expIdx] = { ...copy[expIdx], [field]: val };
      return { ...prev, experiences: copy };
    });
  };

  const handleExperienceBulletChange = (expIdx: number, bulletIdx: number, val: string) => {
    setResumeData(prev => {
      const copy = [...prev.experiences];
      const bullets = [...copy[expIdx].bulletPoints];
      bullets[bulletIdx] = val;
      copy[expIdx] = { ...copy[expIdx], bulletPoints: bullets };
      return { ...prev, experiences: copy };
    });
  };

  const handleAddExperienceBullet = (expIdx: number) => {
    setResumeData(prev => {
      const copy = [...prev.experiences];
      const bullets = [...copy[expIdx].bulletPoints, "Quantified outcome showing 20%+ improvement using targeted action methods."];
      copy[expIdx] = { ...copy[expIdx], bulletPoints: bullets };
      return { ...prev, experiences: copy };
    });
  };

  const handleRemoveExperienceBullet = (expIdx: number, bulletIdx: number) => {
    setResumeData(prev => {
      const copy = [...prev.experiences];
      const bullets = copy[expIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
      copy[expIdx] = { ...copy[expIdx], bulletPoints: bullets };
      return { ...prev, experiences: copy };
    });
  };

  const handleAddExperienceCard = () => {
    const newExp: ResumeSectionExperience = {
      role: "New Role Title",
      company: "Company / Organization name",
      duration: "Duration (e.g., 2024 - Present)",
      bulletPoints: ["Integrated crucial technologies to elevate system benchmarks and performance indexes."]
    };
    setResumeData(prev => ({ ...prev, experiences: [...prev.experiences, newExp] }));
  };

  const handleRemoveExperienceCard = (idx: number) => {
    setResumeData(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== idx)
    }));
  };

  const handleProjectBulletChange = (projIdx: number, bulletIdx: number, val: string) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const bullets = [...copy[projIdx].bulletPoints];
      bullets[bulletIdx] = val;
      copy[projIdx] = { ...copy[projIdx], bulletPoints: bullets };
      return { ...prev, projects: copy };
    });
  };

  const handleAddProjectBullet = (projIdx: number) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const bullets = [...copy[projIdx].bulletPoints, "Completed key milestones and optimizations aligned with modern architecture standards."];
      copy[projIdx] = { ...copy[projIdx], bulletPoints: bullets };
      return { ...prev, projects: copy };
    });
  };

  const handleRemoveProjectBullet = (projIdx: number, bulletIdx: number) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      const bullets = copy[projIdx].bulletPoints.filter((_, i) => i !== bulletIdx);
      copy[projIdx] = { ...copy[projIdx], bulletPoints: bullets };
      return { ...prev, projects: copy };
    });
  };

  const handleProjectCardChange = (projIdx: number, field: keyof ResumeSectionProject, val: any) => {
    setResumeData(prev => {
      const copy = [...prev.projects];
      copy[projIdx] = { ...copy[projIdx], [field]: val };
      return { ...prev, projects: copy };
    });
  };

  const handleAddProjectCard = () => {
    const newProj: ResumeSectionProject = {
      name: "Product Innovation System",
      description: "Brief scope or engineering stack",
      bulletPoints: ["Designed dynamic schemas and decoupled pipelines reducing architectural overhead."]
    };
    setResumeData(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
  };

  const handleRemoveProjectCard = (idx: number) => {
    setResumeData(prev => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== idx)
    }));
  };

  const handleSkillsTextChange = (val: string) => {
    const arr = val.split(",").map(itm => itm.trim()).filter(itm => itm !== "");
    setResumeData(prev => ({ ...prev, skills: arr }));
  };

  const handleToolsTextChange = (val: string) => {
    const arr = val.split(",").map(itm => itm.trim()).filter(itm => itm !== "");
    setResumeData(prev => ({ ...prev, tools: arr }));
  };

  const handleCertificationsTextChange = (val: string) => {
    const arr = val.split(",").map(itm => itm.trim()).filter(itm => itm !== "");
    setResumeData(prev => ({ ...prev, certifications: arr }));
  };

  const handleEducationCardChange = (eduIdx: number, field: keyof ResumeEducation, val: string) => {
    setResumeData(prev => {
      const copy = [...prev.education];
      copy[eduIdx] = { ...copy[eduIdx], [field]: val };
      return { ...prev, education: copy };
    });
  };

  const handleAddEducationCard = () => {
    const newEdu: ResumeEducation = {
      degree: "Degree / Focus",
      school: "College or Institution",
      year: "Year"
    };
    setResumeData(prev => ({ ...prev, education: [...prev.education, newEdu] }));
  };

  const handleRemoveEducationCard = (idx: number) => {
    setResumeData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== idx)
    }));
  };

  // Secure print endpoint poster
  const handlePrintDocument = (docType: "resume" | "coverletter" | "all") => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/print";
    form.target = "_blank";

    const typeInput = document.createElement("input");
    typeInput.type = "hidden";
    typeInput.name = "type";
    typeInput.value = docType;
    form.appendChild(typeInput);

    const templateInput = document.createElement("input");
    templateInput.type = "hidden";
    templateInput.name = "template";
    templateInput.value = selectedTemplate;
    form.appendChild(templateInput);

    const dataInput = document.createElement("input");
    dataInput.type = "hidden";
    dataInput.name = "resumeDataJson";
    dataInput.value = JSON.stringify(resumeData);
    form.appendChild(dataInput);

    const coverLetterInput = document.createElement("input");
    coverLetterInput.type = "hidden";
    coverLetterInput.name = "coverLetterText";
    coverLetterInput.value = coverLetter;
    form.appendChild(coverLetterInput);

    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  // Word doc download for Resume in correct A4 styling
  const handleDownloadDocx = () => {
    const struct = resumeData;
    const isClassic = selectedTemplate === "Classic";
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${struct.name} - Tailored Resume</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 0.75in 0.75in 0.75in 0.75in;
          }
          body { 
            font-family: ${isClassic ? '"Times New Roman", Times, Georgia, serif' : '"Arial", "Helvetica", sans-serif'}; 
            font-size: 10.5pt; 
            line-height: 1.35; 
            color: #111111; 
          }
          h1 { 
            font-size: 18pt; 
            text-align: ${isClassic ? 'center' : 'left'}; 
            font-weight: bold; 
            margin-top: 0pt;
            margin-bottom: 4pt; 
            text-transform: ${isClassic ? 'uppercase' : 'none'}; 
            color: #020617; 
          }
          .contact { 
            text-align: ${isClassic ? 'center' : 'left'}; 
            font-size: 9pt; 
            color: #475569; 
            margin-bottom: 12pt; 
            border-bottom: 2px solid ${isClassic ? '#111111' : '#4F46E5'}; 
            padding-bottom: 6pt; 
          }
          h2 { 
            font-size: 11.5pt; 
            font-weight: bold; 
            margin-top: 14pt; 
            margin-bottom: 5pt; 
            text-transform: uppercase; 
            border-bottom: 1px solid #cbd5e1; 
            padding-bottom: 1pt; 
            color: ${isClassic ? '#000000' : '#4338ca'}; 
          }
          .summary { 
            margin-bottom: 10pt; 
            text-align: justify; 
            font-size: 10pt;
            color: #334155;
          }
          .job-title { 
            font-weight: bold; 
            font-size: 10.5pt; 
            color: #0f172a; 
          }
          .company-duration { 
            font-style: italic; 
            color: #475569; 
          }
          ul { 
            margin-top: 2pt; 
            margin-bottom: 6pt; 
            padding-left: 18pt; 
          }
          li { 
            margin-bottom: 3pt; 
            text-align: justify; 
            font-size: 10pt;
            color: #334155;
          }
          .skills-list { 
            font-size: 10pt; 
            line-height: 1.4;
            color: #334155;
          }
        </style>
      </head>
      <body>
        <h1>${struct.name}</h1>
        <div class="contact">${struct.contactInfo}</div>
        
        ${isClassic ? `
          <h2>Professional Summary</h2>
          <p class="summary">${struct.summary}</p>
          
          <h2>Skills & Competencies</h2>
          <p class="skills-list">${struct.skills.join(' • ')}</p>
          
          ${struct.tools && struct.tools.length > 0 ? `
            <h2>Tools & Technologies</h2>
            <p class="skills-list">${struct.tools.join(' • ')}</p>
          ` : ''}

          <h2>Professional Experience</h2>
          ${struct.experiences.map(exp => `
            <div style="margin-bottom: 8pt;">
              <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 2pt;">
                <tr>
                  <td class="job-title" align="left">${exp.role} <span style="font-weight:normal;color:#aaa;">|</span> <span class="company-duration">${exp.company}</span></td>
                  <td align="right" style="font-size: 9pt; color:#64748b;" class="company-duration">${exp.duration}</td>
                </tr>
              </table>
              <ul>
                ${exp.bulletPoints.map(bullet => `<li>${bullet}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
          
          ${struct.projects && struct.projects.length > 0 ? `
            <h2>Selected Projects</h2>
            ${struct.projects.map(proj => `
              <div style="margin-bottom: 6pt;">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 2pt;">
                  <tr>
                    <td class="job-title" align="left">${proj.name} <span style="font-weight:normal;color:#64748b;font-size:9pt;">— ${proj.description}</span></td>
                    <td></td>
                  </tr>
                </table>
                <ul>
                  ${proj.bulletPoints.map(bullet => `<li>${bullet}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          ` : ''}
          
          <h2>Education</h2>
          ${struct.education.map(edu => `
            <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 4pt;">
              <tr>
                <td align="left"><strong>${edu.degree}</strong> <span style="font-weight:normal;color:#aaa;">|</span> ${edu.school}</td>
                <td align="right" style="font-size: 9pt; color:#64748b;" class="company-duration">${edu.year}</td>
              </tr>
            </table>
          `).join('')}

          ${struct.certifications && struct.certifications.length > 0 ? `
            <h2>Certifications</h2>
            <p class="skills-list">${struct.certifications.join(' • ')}</p>
          ` : ''}
        ` : `
          <h2>Profile</h2>
          <p class="summary">${struct.summary}</p>

          ${struct.projects && struct.projects.length > 0 ? `
            <h2>Projects</h2>
            ${struct.projects.map(proj => `
              <div style="margin-bottom: 6pt;">
                <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 2pt;">
                  <tr>
                    <td class="job-title" align="left">${proj.name} <span style="font-weight:normal;color:#64748b;font-size:9pt;">— ${proj.description}</span></td>
                    <td></td>
                  </tr>
                </table>
                <ul>
                  ${proj.bulletPoints.map(bullet => `<li>${bullet}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          ` : ''}

          <h2>Experience</h2>
          ${struct.experiences.map(exp => `
            <div style="margin-bottom: 8pt;">
              <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 2pt;">
                <tr>
                  <td class="job-title" align="left">${exp.role} <span style="font-weight:normal;color:#aaa;">@</span> <span style="color:#4338ca;">${exp.company}</span></td>
                  <td align="right" style="font-size: 9pt; color:#64748b;" class="company-duration">${exp.duration}</td>
                </tr>
              </table>
              <ul>
                ${exp.bulletPoints.map(bullet => `<li>${bullet}</li>`).join('')}
              </ul>
            </div>
          `).join('')}

          <h2>Skills</h2>
          <p class="skills-list"><strong>Core Specialties:</strong> ${struct.skills.join(' • ')}</p>
          ${struct.tools && struct.tools.length > 0 ? `
            <p class="skills-list" style="margin-top:4px;"><strong>Tools & Technologies:</strong> ${struct.tools.join(' • ')}</p>
          ` : ''}

          <h2>Education</h2>
          ${struct.education.map(edu => `
            <table border="0" cellpadding="0" cellspacing="0" style="width:100%; margin-bottom: 4pt;">
              <tr>
                <td align="left"><strong>${edu.degree}</strong> <span style="font-weight:normal;color:#aaa;">|</span> ${edu.school}</td>
                <td align="right" style="font-size: 9pt; color:#64748b;" class="company-duration">${edu.year}</td>
              </tr>
            </table>
          `).join('')}
        `}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${struct.name.replace(/\s+/g, "_")}_Tailored_Resume.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Word doc download for Cover letter
  const handleDownloadCoverLetterDocx = () => {
    const struct = resumeData;
    const formattedLetter = coverLetter.replace(/\n/g, "<br />");
    
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${struct.name} - Cover Letter</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 8.5in 11in;
            margin: 1.0in 1.0in 1.0in 1.0in;
          }
          body { 
            font-family: "Arial", "Helvetica", sans-serif; 
            font-size: 11pt; 
            line-height: 1.45; 
            color: #1a1a1a; 
          }
          h1 { 
            font-size: 18pt; 
            text-align: left; 
            font-weight: bold; 
            margin-top: 0pt;
            margin-bottom: 4pt; 
            color: #111111; 
          }
          .contact { 
            font-size: 9.5pt; 
            color: #555555; 
            margin-bottom: 24pt; 
            border-bottom: 1px solid #cccccc; 
            padding-bottom: 8pt; 
          }
          .letter-body {
            font-size: 11pt;
            text-align: justify;
          }
        </style>
      </head>
      <body>
        <h1>${struct.name}</h1>
        <div class="contact">${struct.contactInfo}</div>
        
        <div class="letter-body">
          <p style="margin-bottom:12pt; color:#444444;">Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p>${formattedLetter}</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${struct.name.replace(/\s+/g, "_")}_Cover_Letter.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCompanyPersonaDetails = (type: CompanyPersonality) => {
    switch (type) {
      case "Startup":
        return {
          icon: <Rocket className="w-8 h-8 text-indigo-600 animate-pulse" />,
          bgColor: "bg-indigo-50/40 border-indigo-100",
          textColor: "text-indigo-900",
          badgeColor: "bg-indigo-600 text-white",
          motto: "Agility, Rapid Prototyping & Absolute Ownership",
          label: "High-Growth Startup"
        };
      case "Enterprise":
        return {
          icon: <Building2 className="w-8 h-8 text-blue-600" />,
          bgColor: "bg-slate-50 border-slate-200",
          textColor: "text-slate-800",
          badgeColor: "bg-slate-700 text-white",
          motto: "Scalability, Standards Compliance & Structured Systems",
          label: "Corporate Enterprise"
        };
      case "Agency":
        return {
          icon: <Palette className="w-8 h-8 text-purple-600" />,
          bgColor: "bg-purple-50/40 border-purple-100",
          textColor: "text-purple-900",
          badgeColor: "bg-purple-600 text-white",
          motto: "Creative Client Solutions, Multi-Project Cadence & Speed",
          label: "Creative Agency"
        };
    }
  };

  const persona = getCompanyPersonaDetails(data.companyType);

  return (
    <div id="results-root" className="max-w-6xl mx-auto px-6 py-12 font-sans relative">
      
      {/* Screen Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-5 print:hidden">
        <div>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
            Optimizations Completed
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            Tailored Application Kit
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </h2>
        </div>
        
        {/* Workspace Persistent Actions */}
        <div className="flex flex-wrap gap-2.5">
          <button
            id="btn-workspace-analyze-new"
            onClick={onAnalyzeNewJob}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Analyze New Job
          </button>
          
          <button
            id="btn-workspace-upload-new"
            onClick={onUploadNewCV}
            className="px-4 py-2.5 rounded-xl border border-rose-100 hover:border-rose-200 bg-rose-50/10 hover:bg-rose-50 text-rose-650 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-rose-500" />
            Upload New CV
          </button>
        </div>
      </div>

      {/* Structured Tab Switcher */}
      <div className="flex border-b border-slate-200 mb-8 print:hidden">
        <button
          onClick={() => setActiveMainTab("overview")}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMainTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-850"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setActiveMainTab("resume")}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMainTab === "resume"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-850"
          }`}
        >
          <FileText className="w-4 h-4" />
          Optimized Resume
        </button>
        <button
          onClick={() => setActiveMainTab("coverletter")}
          className={`py-3 px-5 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeMainTab === "coverletter"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-850"
          }`}
        >
          <FileText className="w-4 h-4" />
          Custom Cover Letter
        </button>
      </div>

      {/* Guide Banner for Recruiter Customizations */}
      {alertVisible && (activeMainTab === "resume" || activeMainTab === "coverletter") && (
        <div className="mb-6 p-4 bg-indigo-50/70 text-indigo-950 rounded-2xl border border-indigo-100 flex items-start gap-3 shadow-2xs print:hidden animate-fade-in">
          <Info className="w-4.5 h-4.5 flex-shrink-0 text-indigo-600 mt-0.5" />
          <div className="flex-grow text-left">
            <p className="text-xs font-bold">Document Customization Guide:</p>
            <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
              If you wish to make quick adjustments to names, contact coordinates, or bullet items before export, click the <span className="font-semibold text-indigo-950">"Adjust Document Details"</span> toggle on each tab. To export a PDF, click <span className="font-semibold text-indigo-950">"Download PDF"</span> and choose your computer's built-in <span className="font-semibold text-indigo-950">"Save as PDF"</span> print preset. Enable <span className="font-semibold text-indigo-950">"Background graphics"</span> to preserve layout color tags.
            </p>
          </div>
          <button
            onClick={() => setAlertVisible(false)}
            className="text-xs font-semibold text-indigo-500 hover:text-indigo-800 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Tab Content Segment */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1 — OVERVIEW */}
        {activeMainTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 text-left"
          >
            {/* Split layout: Match and Rationale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              
              {/* Match Score Hero Card in Overview Tab */}
              <div className="bg-gradient-to-br from-indigo-50/40 via-white to-white border border-slate-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xs">
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider font-mono">
                  ATS Match Score
                </span>
                
                {/* Large visual rating */}
                <h3 className="text-6xl font-black text-slate-900 tracking-tight mt-6 mb-2">
                  {data.matchScore}% Match
                </h3>
                <p className="text-xs text-slate-400 font-mono tracking-wide uppercase font-bold">
                  Compatibility Index
                </p>
                
                {/* Visual Gauge bar */}
                <div className="w-full max-w-xs mt-6 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      data.matchScore >= 80 
                        ? "bg-emerald-500" 
                        : data.matchScore >= 65 
                        ? "bg-indigo-600" 
                        : "bg-orange-500"
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${data.matchScore}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-6 max-w-sm text-justify">
                  {data.matchScore >= 85 
                    ? "Exceptional candidate match. Your core skills align seamlessly with this template's technical expectations and localized corporate stack." 
                    : data.matchScore >= 70 
                    ? "Highly compatible placement. Localizing achievement terminology and credentials creates an extremely viable interview pipeline candidate."
                    : "Some technical or certification voids identified, which we have supplemented directly inside your optimized resume package."}
                </p>
              </div>

              {/* Template Recommendation & Style Rationale */}
              <div className="bg-slate-950 border border-slate-900 rounded-3xl p-8 text-white flex flex-col justify-between shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                    <Award className="w-4.5 h-4.5" />
                    Resume Style Recommendation
                  </div>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider font-mono block">Recommended Template</span>
                    <h4 className="text-2xl font-black text-white tracking-tight">
                      {selectedTemplate === "Classic" ? "Classic ATS Template" : "Modern ATS Template"}
                    </h4>
                  </div>

                  <p className="text-slate-300 text-xs leading-relaxed text-justify">
                    {data.recommendationReason || "Suggested format is hand-selected based on the targeted organization culture, tech stack requirements, and domain guidelines to maximize ATS processing viability."}
                  </p>
                </div>

                <button
                  onClick={() => setActiveMainTab("resume")}
                  className="mt-6 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-2xl cursor-pointer transition-all self-start w-full sm:w-auto shadow-sm"
                >
                  View Custom Resume Preview
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Grid for Skills Breakdown & Selected Optimizations */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
              
              {/* Skills Breakdown Box (4 cols) */}
              <div className="lg:col-span-5 space-y-6">
                
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <Star className="w-4.5 h-4.5 text-amber-500 fill-amber-500" />
                      Skills Breakdown
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Review matched proficiencies and supplemented gaps.
                    </p>
                  </div>

                  {/* Strong Matches */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md tracking-wider font-mono uppercase">
                      Strong Matches
                    </span>
                    <div className="space-y-2 pl-1 pt-1">
                      {data.strengths && data.strengths.slice(0, 6).map((str, idx) => (
                        <div key={idx} className="flex gap-2 items-start text-xs">
                          <span className="w-4 h-4 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-[10px] shrink-0 mt-0.5">✓</span>
                          <span className="text-slate-700 font-medium">{str}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing/Fortified Skills */}
                  <div className="space-y-2.5 pt-1">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md tracking-wider font-mono uppercase">
                      Supplemented / Gaps Fortified
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {data.missingKeywords && data.missingKeywords.length > 0 ? (
                        data.missingKeywords.map((kw, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 border border-slate-205 rounded-lg font-medium"
                          >
                            {kw}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">All key targeted skills fully represented.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>

              {/* Resume Improvements (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-2xs space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight flex items-center gap-2">
                      <CheckCircle2 className="w-4.5 h-4.5 text-indigo-600" />
                      Key Resume Improvements
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Review 2–3 major metric advancements injected to boost interview conversion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {data.optimizations && data.optimizations.slice(0, 3).map((opt, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden shadow-3xs">
                        <div className="grid grid-cols-1 md:grid-cols-2">
                          <div className="p-3 bg-red-50/10 border-r border-slate-100 text-xs">
                            <span className="text-[9px] font-bold font-mono text-red-650 uppercase tracking-wider block mb-1">
                              Weak Draft Bulllet
                            </span>
                            <p className="text-slate-500 italic">"{opt.before}"</p>
                          </div>
                          <div className="p-3 bg-emerald-50/10 text-xs shadow-inner">
                            <span className="text-[9px] font-bold font-mono text-emerald-600 uppercase tracking-wider block mb-1">
                              Optimized Achievement Inbound
                            </span>
                            <p className="text-slate-900 font-semibold">"{opt.after}"</p>
                          </div>
                        </div>
                        <div className="px-3.5 py-1.5 bg-slate-50/80 text-[10px] text-slate-500 border-t border-slate-100 flex justify-between items-center flex-wrap gap-2">
                          <span className="font-bold text-slate-650">Optimized Strategy:</span>
                          <span>{opt.impact}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* TAB 2 — RESUME */}
        {activeMainTab === "resume" && (
          <motion.div
            key="resume"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 text-left"
          >
            {/* Dynamic Card Container for Resume settings */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
              
              {/* Toolbar */}
              <div className="p-5 bg-slate-50/70 border-b border-indigo-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
                
                {/* Template option triggers */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">Template Style:</span>
                  <div className="flex bg-slate-200/50 p-1 rounded-xl">
                    <button
                      onClick={() => setSelectedTemplate("Classic")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        selectedTemplate === "Classic" 
                          ? "bg-white text-slate-900 shadow-3xs border border-slate-100" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Classic ATS Symmetrical
                    </button>
                    <button
                      onClick={() => setSelectedTemplate("Modern")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        selectedTemplate === "Modern" 
                          ? "bg-indigo-650 text-white shadow-3xs" 
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Modern Recruiter Clean
                    </button>
                  </div>
                </div>

                {/* Exporters and copy triggers */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadDocx}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Download DOCX
                  </button>
                  <button
                    onClick={() => handlePrintDocument("resume")}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Download PDF Document
                  </button>
                  <button
                    onClick={handleCopyStructuredText}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Copy Plain Text
                      </>
                    )}
                  </button>
                </div>

              </div>

              {/* Interactive editor toggler */}
              <div className="px-6 py-3 bg-indigo-50/20 border-b border-indigo-50/50 flex justify-between items-center">
                <p className="text-[11px] text-indigo-900 font-medium">
                  Recommendation style: <span className="font-bold">{data.recommendedTemplate === "Portfolio" ? "Modern ATS cleanliness is recommended" : "Classic ATS symmetry is recommended"}</span>.
                </p>
                <button
                  onClick={() => setIsResumeEditing(!isResumeEditing)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  {isResumeEditing ? "Hide Editor Fields" : "Adjust Document Details"}
                  {isResumeEditing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* COLLAPSIBLE ACTIVE FORM EDITOR */}
              <AnimatePresence>
                {isResumeEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="border-b border-slate-100 overflow-hidden bg-slate-50/50"
                  >
                    <div className="p-6 space-y-5 text-xs text-left max-w-3xl mx-auto">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Candidate Name</span>
                          <input
                            type="text"
                            value={resumeData.name}
                            onChange={(e) => handleBasicChange("name", e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Contact Credentials</span>
                          <input
                            type="text"
                            value={resumeData.contactInfo}
                            onChange={(e) => handleBasicChange("contactInfo", e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Professional Summary / Objective</span>
                        <textarea
                          rows={3}
                          value={resumeData.summary}
                          onChange={(e) => handleBasicChange("summary", e.target.value)}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Skills (comma split)</span>
                          <textarea
                            rows={2}
                            value={resumeData.skills.join(", ")}
                            onChange={(e) => handleSkillsTextChange(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Tools & Platforms</span>
                          <textarea
                            rows={2}
                            value={resumeData.tools?.join(", ") || ""}
                            onChange={(e) => handleToolsTextChange(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Certifications</span>
                          <textarea
                            rows={2}
                            value={resumeData.certifications?.join(", ") || ""}
                            onChange={(e) => handleCertificationsTextChange(e.target.value)}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Work History */}
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="flex justify-between items-center">
                          <span className="font-extrabold uppercase text-[10px] text-indigo-950 font-mono tracking-wider">Work history</span>
                          <button
                            onClick={handleAddExperienceCard}
                            className="text-[10px] font-bold text-indigo-650 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Position
                          </button>
                        </div>
                        <div className="space-y-3.5">
                          {resumeData.experiences.map((exp, idx) => (
                            <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 space-y-2.5 relative">
                              <button
                                onClick={() => handleRemoveExperienceCard(idx)}
                                className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 font-bold"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <input
                                  type="text"
                                  value={exp.role}
                                  placeholder="Role Title"
                                  onChange={(e) => handleExperienceChange(idx, "role", e.target.value)}
                                  className="p-1.5 border border-slate-200 rounded text-xs font-bold"
                                />
                                <input
                                  type="text"
                                  value={exp.company}
                                  placeholder="Company"
                                  onChange={(e) => handleExperienceChange(idx, "company", e.target.value)}
                                  className="p-1.5 border border-slate-200 rounded text-xs"
                                />
                                <input
                                  type="text"
                                  value={exp.duration}
                                  placeholder="Duration"
                                  onChange={(e) => handleExperienceChange(idx, "duration", e.target.value)}
                                  className="p-1.5 border border-slate-200 rounded text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-450 uppercase block">Quantified Key Achievements</span>
                                {exp.bulletPoints.map((b, bIdx) => (
                                  <div key={bIdx} className="flex gap-2 items-center">
                                    <input
                                      type="text"
                                      value={b}
                                      onChange={(e) => handleExperienceBulletChange(idx, bIdx, e.target.value)}
                                      className="flex-grow p-1 border border-slate-200 rounded text-[11px]"
                                    />
                                    <button
                                      disabled={exp.bulletPoints.length <= 1}
                                      onClick={() => handleRemoveExperienceBullet(idx, bIdx)}
                                      className="text-slate-400 hover:text-rose-600 cursor-pointer text-xs"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => handleAddExperienceBullet(idx)}
                                  className="text-[9px] text-slate-500 font-bold bg-slate-50 hover:bg-slate-100 px-2 py-1 rounded border border-slate-200 mt-1 cursor-pointer"
                                >
                                  + Insert Achievement Bullet
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* DOCUMENT WHITE PAGE ON SLATE CANVAS */}
              <div className="p-8 sm:p-12 bg-slate-100/90 flex justify-center border-t border-slate-100">
                
                {/* CLASSIC ATS TEMPLATE RENDERING (Georgia Font, Centered Header, Symmetrical Segmenting) */}
                {selectedTemplate === "Classic" && (
                  <div 
                    id="print-resume-stage-classic"
                    className="w-full max-w-2xl bg-white p-12 sm:p-16 shadow-lg border border-slate-205 text-left text-slate-900 leading-relaxed font-serif relative overflow-hidden"
                    style={{ fontFamily: "Georgia, serif", minHeight: "820px" }}
                  >
                    {/* Symmetrical Centered Header */}
                    <div className="text-center pb-4 border-b-2 border-slate-900">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight uppercase text-slate-950 font-serif leading-none">
                        {resumeData.name}
                      </h1>
                      <div className="text-[11.5px] text-slate-700 mt-2.5 font-sans tracking-tight leading-relaxed">
                        {resumeData.contactInfo}
                      </div>
                    </div>

                    {/* Section 1: Summary */}
                    <div className="space-y-2 mt-7">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                        Professional Summary
                      </h2>
                      <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify pt-1.5">
                        {resumeData.summary}
                      </p>
                    </div>

                    {/* Section 2: Skills */}
                    <div className="space-y-2 mt-7">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                        Skills & Competencies
                      </h2>
                      <p className="text-[11.5px] text-slate-800 leading-relaxed font-sans pt-1.5">
                        {resumeData.skills && resumeData.skills.join(" • ")}
                      </p>
                    </div>

                    {/* Section 3: Work Experience */}
                    <div className="space-y-2 mt-7">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                        Professional Experience
                      </h2>
                      <div className="space-y-5 pt-1.5">
                        {resumeData.experiences && resumeData.experiences.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline text-[11.5px] font-sans">
                              <div>
                                <strong className="text-slate-950 font-extrabold">{exp.role}</strong>
                                <span className="text-slate-350 mx-2">|</span>
                                <span className="text-slate-700 italic font-medium">{exp.company}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 shrink-0 uppercase tracking-widest leading-none font-bold">
                                {exp.duration}
                              </span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1.5 mt-1.5 font-sans text-[11px] text-slate-750">
                              {exp.bulletPoints && exp.bulletPoints.map((bullet, bID) => (
                                <li key={bID} className="text-justify leading-relaxed">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 4: Projects */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                      <div className="space-y-2 mt-7">
                        <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                          Selected Projects
                        </h2>
                        <div className="space-y-4 pt-1.5">
                          {resumeData.projects.map((proj, idx) => (
                            <div key={idx} className="space-y-1 text-[11.5px]">
                              <div className="font-sans leading-snug">
                                <span className="text-slate-950 font-extrabold">{proj.name}</span>
                                <span className="text-slate-400 mx-2">—</span>
                                <span className="text-slate-600 font-medium italic">{proj.description}</span>
                              </div>
                              <ul className="list-disc pl-5 space-y-1.5 mt-1.5 text-[11px] text-slate-755 font-sans">
                                {proj.bulletPoints && proj.bulletPoints.map((bullet, bID) => (
                                  <li key={bID} className="text-justify leading-relaxed">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section 5: Education */}
                    <div className="space-y-2 mt-7">
                      <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                        Education
                      </h2>
                      <div className="space-y-2 pt-1.5">
                        {resumeData.education && resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11.5px] font-sans">
                            <div>
                              <span className="font-extrabold text-slate-950">{edu.degree}</span>
                              <span className="text-slate-350 mx-2">|</span>
                              <span className="text-slate-700">{edu.school}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-bold">
                              {edu.year}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Section 6: Certifications */}
                    {resumeData.certifications && resumeData.certifications.length > 0 && (
                      <div className="space-y-2 mt-7">
                        <h2 className="text-[13px] font-bold uppercase tracking-widest text-slate-950 border-b border-slate-350 pb-1 font-sans leading-none">
                          Certifications
                        </h2>
                        <p className="text-[11px] text-slate-800 leading-normal font-sans pt-1.5">
                          {resumeData.certifications.join(" • ")}
                        </p>
                      </div>
                    )}

                  </div>
                )}

                {/* MODERN ATS TEMPLATE RENDERING (Inter Sans Font, Left Header, Actionable Indigo Highlights) */}
                {selectedTemplate === "Modern" && (
                  <div 
                    id="print-resume-stage-modern"
                    className="w-full max-w-2xl bg-white p-12 sm:p-16 shadow-lg border border-slate-205 text-left text-slate-900 leading-relaxed font-sans relative overflow-hidden"
                    style={{ fontFamily: '"Inter", sans-serif', minHeight: "820px" }}
                  >
                    {/* Symmetrical Left-Aligned Header with Indigo Accent border */}
                    <div className="space-y-2.5 pb-4 border-b-2.5 border-indigo-600">
                      <h1 className="text-3xl font-black text-slate-950 tracking-tight font-sans leading-none">
                        {resumeData.name}
                      </h1>
                      <p className="text-[11px] text-slate-600 font-medium tracking-normal mt-2 leading-relaxed">
                        {resumeData.contactInfo}
                      </p>
                    </div>

                    {/* Profile Summary */}
                    <div className="space-y-2 mt-8">
                      <h2 className="text-[11.5px] font-extrabold uppercase tracking-widest text-indigo-700 leading-none">
                        Profile
                      </h2>
                      <p className="text-[11.5px] text-slate-800 leading-relaxed text-justify pt-1.5">
                        {resumeData.summary}
                      </p>
                    </div>

                    {/* Projects Section (Placed high to promote client deliverables) */}
                    {resumeData.projects && resumeData.projects.length > 0 && (
                      <div className="space-y-3 mt-8">
                        <h2 className="text-[11.5px] font-extrabold uppercase tracking-widest text-indigo-700 leading-none">
                          Projects
                        </h2>
                        <div className="space-y-4 pt-1.5">
                          {resumeData.projects.map((proj, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="text-[11.5px] leading-snug">
                                <span className="font-extrabold text-slate-950">{proj.name}</span>
                                <span className="text-[10.5px] text-slate-500 italic ml-1.5">— {proj.description}</span>
                              </div>
                              <ul className="list-disc pl-5 space-y-1.5 mt-1.5 text-[11px] text-slate-700 leading-relaxed">
                                {proj.bulletPoints && proj.bulletPoints.map((bullet, bID) => (
                                  <li key={bID} className="text-justify">
                                    {bullet}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Experience Timeline */}
                    <div className="space-y-3 mt-8">
                      <h2 className="text-[11.5px] font-extrabold uppercase tracking-widest text-indigo-700 leading-none">
                        Experience
                      </h2>
                      <div className="space-y-5 pt-1.5">
                        {resumeData.experiences && resumeData.experiences.map((exp, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-baseline text-[11.5px]">
                              <div>
                                <strong className="text-slate-950 font-extrabold">{exp.role}</strong>
                                <span className="text-slate-350 mx-2">@</span>
                                <span className="text-indigo-950 font-bold">{exp.company}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-500 font-bold shrink-0">
                                {exp.duration}
                              </span>
                            </div>
                            <ul className="list-disc pl-5 space-y-1.5 mt-1.5 text-slate-700 text-[11px]">
                              {exp.bulletPoints && exp.bulletPoints.map((bullet, bID) => (
                                <li key={bID} className="text-justify leading-relaxed">
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Skills + Optional Tools and Technologies */}
                    <div className="space-y-2 mt-8">
                      <h2 className="text-[11.5px] font-extrabold uppercase tracking-widest text-indigo-700 leading-none">
                        Skills
                      </h2>
                      <div className="space-y-1 leading-relaxed text-[11.5px] pt-1.5">
                        <p className="text-slate-800">
                          <strong>Core Specialties:</strong> {resumeData.skills && resumeData.skills.join(" • ")}
                        </p>
                        {resumeData.tools && resumeData.tools.length > 0 && (
                          <p className="text-slate-800 mt-1">
                            <strong>Tools & Technologies:</strong> {resumeData.tools.join(" • ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    <div className="space-y-2 mt-8">
                      <h2 className="text-[11.5px] font-extrabold uppercase tracking-widest text-indigo-700 leading-none">
                        Education
                      </h2>
                      <div className="space-y-2 pt-1.5">
                        {resumeData.education && resumeData.education.map((edu, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11.5px]">
                            <div>
                              <span className="font-extrabold text-slate-900">{edu.degree}</span>
                              <span className="text-slate-350 mx-2">|</span>
                              <span className="text-slate-650">{edu.school}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 font-semibold">
                              {edu.year}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>
          </motion.div>
        )}

        {/* TAB 3 — COVER LETTER */}
        {activeMainTab === "coverletter" && (
          <motion.div
            key="coverletter"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6 text-left"
          >
            {/* Main Stage for Letter Draft */}
            <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs overflow-hidden">
              
              {/* Cover Letter action items toolbar */}
              <div className="p-5 bg-slate-50/70 border-b border-indigo-50/50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <p className="text-xs text-slate-600 font-bold uppercase tracking-wider font-mono">
                    Custom Cover Letter
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadCoverLetterDocx}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Download DOCX
                  </button>
                  <button
                    onClick={() => handlePrintDocument("coverletter")}
                    className="px-3.5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Download PDF Document
                  </button>
                  <button
                    onClick={handleCopyCoverLetterText}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-3xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied Text!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        Copy Letter Text
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Toggle adjustments */}
              <div className="px-6 py-3 bg-indigo-50/25 border-b border-indigo-50/50 flex justify-end items-center">
                <button
                  onClick={() => setIsLetterEditing(!isLetterEditing)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all uppercase tracking-wider"
                >
                  <Edit2 className="w-3 h-3 text-slate-500" />
                  {isLetterEditing ? "Hide Text Editor" : "Adjust Letter Content"}
                  {isLetterEditing ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* COLLAPSIBLE COVER LETTER TEXT AREA EDITOR */}
              <AnimatePresence>
                {isLetterEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-b border-slate-100 bg-slate-50/50 p-6"
                  >
                    <div className="max-w-2xl mx-auto space-y-2">
                       <span className="font-bold uppercase text-[9px] text-slate-500 tracking-wider">Letter Text Body</span>
                       <textarea
                         rows={12}
                         value={coverLetter}
                         onChange={(e) => setCoverLetter(e.target.value)}
                         className="w-full p-3.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:outline-none font-serif leading-relaxed"
                       />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* VISUAL DOCUMENT PAGE REPRESENTATION */}
              <div className="p-8 sm:p-12 bg-slate-100/90 flex justify-center border-t border-slate-100">
                <div 
                  id="print-coverletter-stage"
                  className="w-full max-w-2xl bg-white p-12 sm:p-16 shadow-lg border border-slate-205 text-left text-slate-900 leading-relaxed font-sans relative overflow-hidden"
                  style={{ minHeight: "825px" }}
                >
                  {/* Cover letter header */}
                  <div className="border-b-2 border-indigo-600 pb-4 mb-6">
                    <h1 className="text-3xl font-black text-slate-950 tracking-tight leading-none">
                      {resumeData.name}
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium tracking-normal mt-2 leading-relaxed">
                      {resumeData.contactInfo}
                    </p>
                  </div>

                  {/* Letter content elements */}
                  <div className="space-y-4 text-[12px] font-sans text-slate-700">
                    <p className="text-slate-450">
                      Date: <span className="font-semibold text-slate-800">{new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </p>
                    
                    <div className="space-y-1 mt-3">
                      <p className="font-bold text-slate-900">To the Recruiting Team,</p>
                    </div>

                    <div className="mt-6 pt-2 font-serif text-[12.5px] text-slate-850 leading-relaxed text-justify whitespace-pre-line leading-relaxed">
                      {coverLetter}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
