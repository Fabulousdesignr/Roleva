import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import mammoth from "mammoth";

// Load environment variables in local development
dotenv.config();

const PORT = 3000;

const app = express();

async function startServer() {

  // Configure body limits for PDF uploads (base64 can be slightly larger)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API Endpoint: Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Endpoint: Extract/parse uploaded resume
  app.post("/api/extract", async (req, res) => {
    try {
      const { fileData, mimeType, fileName, rawText } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in environment variables. Please add it to your Secrets."
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      let textToParse = "";
      let hasPdfBytes = false;
      let pdfBase64 = "";

      if (rawText && rawText.trim()) {
        textToParse = rawText;
      } else if (fileData && mimeType) {
        const fileExtension = fileName ? fileName.split(".").pop()?.toLowerCase() : "";

        if (mimeType.includes("pdf") || fileExtension === "pdf") {
          hasPdfBytes = true;
          pdfBase64 = fileData;
        } else if (
          mimeType.includes("wordprocessingml") || 
          mimeType.includes("docx") || 
          fileExtension === "docx"
        ) {
          try {
            const buffer = Buffer.from(fileData, "base64");
            const result = await mammoth.extractRawText({ buffer });
            textToParse = result.value;
          } catch (mammothErr: any) {
            console.error("[Roleva Server] Mammoth parsing failed:", mammothErr);
            return res.status(400).json({
              error: "Could not parse DOCX file content. Please type or copy-paste your resume manually."
            });
          }
        } else {
          // Default to text decoding
          try {
            textToParse = Buffer.from(fileData, "base64").toString("utf-8");
          } catch (utfErr) {
            textToParse = "";
          }
        }
      }

      if (!hasPdfBytes && (!textToParse || !textToParse.trim())) {
        return res.status(400).json({
          error: "No readable resume content provided. Please upload a PDF, DOCX or enter text."
        });
      }

      const extractionSystemInstruction = `You are Roleva ATS Resume Import Engine, a professional parser.
Your single objective is to take the provided resume data and parse it into an extremely clean, standardized JSON format.

Ensure you carefully extract:
1. Candidate Full Name -> "name"
2. Contact Information: email, phone, location, websites -> "contactInfo"
3. Professional Summary or profile overview -> "summary"
4. Skills: all technologies, frameworks, methodologies -> list of string "skills"
5. Experiences: list of employment history. Each must have "role", "company", "duration", and list of string "bulletPoints"
6. Education: list of academic histories. Each must have "degree", "school", "year"
7. Certifications: list of certification names.

Do NOT invent, hallucinate, or exaggerate metrics. Fill with empty string/arrays if not present in the original text, keeping the information factual as-is. Clean up any scanning artifacts or double list identifiers.`;

      const extractionResponseSchema = {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Candidate Full Name. If not found, leave blank." },
          contactInfo: { type: Type.STRING, description: "Candidate Contact Details, e.g. 'john@doe.com | +1 555-0100 | City, ST | linkedin.com/in/johndoe'. If not found, leave blank." },
          summary: { type: Type.STRING, description: "Professional summary paragraph. If not found, leave empty." },
          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of technical frameworks, skills, or methodologies."
          },
          experiences: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                role: { type: Type.STRING, description: "Job title / role" },
                company: { type: Type.STRING, description: "Company brand or Project Name" },
                duration: { type: Type.STRING, description: "Employment tenure, e.g. 'Jan 2021 - Oct 2023' or '2022 - Present'" },
                bulletPoints: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Individual performance description lines."
                }
              },
              required: ["role", "company", "duration", "bulletPoints"]
            }
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                degree: { type: Type.STRING, description: "Degree major" },
                school: { type: Type.STRING, description: "School/university/platform" },
                year: { type: Type.STRING, description: "Duration or graduation year" }
              },
              required: ["degree", "school", "year"]
            }
          },
          certifications: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Professional certifications or training accreditations."
          }
        },
        required: ["name", "contactInfo", "summary", "skills", "experiences", "education", "certifications"]
      };

      const contentsParts: any[] = [];
      if (hasPdfBytes) {
        contentsParts.push({
          inlineData: {
            data: pdfBase64,
            mimeType: mimeType || "application/pdf"
          }
        });
        contentsParts.push({
          text: "Parse and extract the above PDF resume document into the JSON response schema."
        });
      } else {
        contentsParts.push({
          text: `CANDIDATE RESUME TEXT:\n${textToParse}\n\nParse and extract the above resume text into the JSON response schema.`
        });
      }

      console.log("[Roleva Server] Extracting resume data via gemini-3.5-flash...");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsParts,
        config: {
          systemInstruction: extractionSystemInstruction,
          responseMimeType: "application/json",
          responseSchema: extractionResponseSchema
        }
      });

      const parsedJSON = JSON.parse(response.text || "{}");
      res.json(parsedJSON);
    } catch (err: any) {
      console.error("[Roleva Server] Extract endpoint failed:", err);
      res.status(500).json({ error: err?.message || "Internal server error during extraction." });
    }
  });

  // API Endpoint: Run AI Resume Analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { resumeText, resumePdf, structuredResume, jobDescription, careerLevel = "Junior (1–3 years)", writingStyle = "Balanced" } = req.body;

      if (!jobDescription || (!resumeText && !resumePdf && !structuredResume)) {
        return res.status(400).json({
          error: "Missing required inputs. Please provide a job description and a resume."
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured in environment variables. Please add it to your Secrets."
        });
      }

      // Initialize Google GenAI client with correct client header and config
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Prepare multi-modal or text contents list
      const contentsParts: any[] = [];

      if (structuredResume) {
        // Render a clean factual resume text from the edited structuredResume data
        const formattedResumeText = `CANDIDATE NAME: ${structuredResume.name || ""}
CONTACT INFO: ${structuredResume.contactInfo || ""}

PROFESSIONAL SUMMARY:
${structuredResume.summary || ""}

SKILLS:
${Array.isArray(structuredResume.skills) ? structuredResume.skills.join(", ") : ""}

WORK EXPERIENCE:
${Array.isArray(structuredResume.experiences) ? structuredResume.experiences.map((exp: any) => `
- Role: ${exp.role || ""}
  Company: ${exp.company || ""}
  Duration: ${exp.duration || ""}
  Key bullet points:
${Array.isArray(exp.bulletPoints) ? exp.bulletPoints.map((b: string) => `    * ${b}`).join("\n") : ""}
`).join("\n") : ""}

EDUCATION:
${Array.isArray(structuredResume.education) ? structuredResume.education.map((edu: any) => `
- Degree: ${edu.degree || ""}
  School: ${edu.school || ""}
  Year: ${edu.year || ""}
`).join("\n") : ""}

CERTIFICATIONS:
${Array.isArray(structuredResume.certifications) ? structuredResume.certifications.join(", ") : ""}
`;

        contentsParts.push({
          text: `CANDIDATE BASE RESUME (Reviewed & Edited):
${formattedResumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

CALIBRATION CONTROL PARAMETERS:
- Selected Career Level: ${careerLevel}
- Selected Writing Style Phrasing Strategy: ${writingStyle}`
        });
      } else if (resumePdf && resumePdf.data) {
        // Send actual PDF bytes directly for native Gemini parsing (multimodal capability)
        contentsParts.push({
          inlineData: {
            data: resumePdf.data, // base64 string
            mimeType: resumePdf.mimeType || "application/pdf"
          }
        });
        contentsParts.push({
          text: `Here is the Candidate's uploaded Resume (above). Below is the Target Job Description and preferences constraints.

TARGET JOB DESCRIPTION:
${jobDescription}

CALIBRATION CONTROL PARAMETERS:
- Selected Career Level: ${careerLevel}
- Selected Writing Style Phrasing Strategy: ${writingStyle}`
        });
      } else {
        // Parse raw text resume
        contentsParts.push({
          text: `CANDIDATE BASE RESUME:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

CALIBRATION CONTROL PARAMETERS:
- Selected Career Level: ${careerLevel}
- Selected Writing Style Phrasing Strategy: ${writingStyle}`
        });
      }

      const systemInstruction = `You are Roleva, an elite Career Strategist and Expert Technical Recruiter.
Your task is to audit the candidate's Resume against the Target Job Description to optimize their profile, dramatically increasing their interview prospects, and to write an exceptional, highly personalized cover letter.

Simplify all terminology: do not refer to "Achievement Optimizer", but "Resume Improvements"; do not refer to "Company Personality Adaptation", but "Resume Style Recommendation"; do not refer to "Final Resume Intelligence", but "Optimized Resume". Keep your tone supportive, professional, and clear.

Follow these CRITICAL RESUME STRATEGY & POSITIONING RULES strictly:
- ZERO FLUFF: Never use generic buzzwords or fluff like "hardworking", "team player", "passionate designer". Focus strictly on hard skills, clear accomplishments, and deliverables.
- MEASURABLE IMPACT: Prioritize measurable outcomes where possible, but keep them realistic. Do NOT exaggerate metrics or invent unbelievable data.
- TITLE-BASED TAILORING: Tailor your emphasis based on the target role:
  * Product Designer / UX Designer / UI-UX Designer: Emphasize product thinking, UX research, usability thinking, user flows, and information systems.
  * UI Designer / Web Designer: Emphasize visuals, design systems, layouts, spacing, components, and design fidelity.
  * Founding Designer / 0-1 Product Designer: Emphasize versatility, speed, high ownership, building from scratch, and rapid execution.
  * Design Engineer: Emphasize design systems, interactive prototypes, no-code development (Framer), design-to-code implementation, and frontend-adjacent skills.

- CONDITIONAL PROJECTS SECTION RULE (CRITICAL):
  * Remove Projects as a default resume section. Projects should NOT always appear.
  * ONLY include a separate projects section (or "Selected Work" / "Selected Projects") if:
    1. The candidate's Selected Career Level is entry-level: "Beginner (0–1 years)".
    2. The candidate's Selected Career Level has limited experience: "Junior (1–3 years)".
    3. The candidate is in a portfolio-heavy role (e.g., job description/title contains "designer", "design", "ux", "ui", "creative", "artist", "architect", "front-end", "frontend", "portfolio").
  * Otherwise, you MUST integrate relevant project work directly into Work Experience bullets, and return "projects" in tailoredResumeStructure as an empty array: [] and omit any Projects section from the Markdown text.

- BULLET POINT QUALITY & STRUCTURE RULES:
  * Maximum 2 lines per bullet under experience or project listings.
  * Provide exactly 3–5 bullets per experience/employment role.
  * Use clear spacing between bullets.
  * NEVER write long paragraphs inside experience/job sections. Keep descriptions formatted strictly as bullet lists.
  * Bullet Structure MUST follow: Action + Scope + Outcome (e.g. "Spearheaded redesigned user checkout funnel, increasing mobile conversion rates by 14%.").
  * Avoid any generic bullets (e.g. "Worked on", "Helped with", "Responsible for"). Prefer stronger but realistic active verbs (e.g. "Spearheaded", "Optimized", "Architected", "Engineered", "Flipped", "Redesigned") combined with realistic outcomes.

- IMPROVED TEMPLATE HIERARCHIES:
  Recommend one of two ATS templates:
  * Template 1 — Standard Resume (Recommends "Standard" in "recommendedTemplate"):
    Sections in Markdown/JSON MUST follow this strict order:
    1. Header (Name, contactInfo)
    2. Professional Summary
    3. Core Skills (from "skills")
    4. Work Experience (from "experiences" - 3-5 bullets per role, max 2 lines per bullet, Action + Scope + Outcome)
    5. Education (from "education")
    6. Certifications / Awards (optional, from "certifications")
    Note: Standard Resume does not have a Projects section unless one of the conditional project-inclusion criteria is met.
  * Template 2 — Portfolio Resume (Recommends "Portfolio" in "recommendedTemplate"):
    Sections in Markdown/JSON MUST follow this strict order:
    1. Header (Name, contactInfo)
    2. Summary (from "summary")
    3. Core Skills / Tools (from "skills" and "tools")
    4. Work Experience (from "experiences" - 3-5 bullets per role, max 2 lines per bullet, Action + Scope + Outcome)
    5. Selected Work (optional, from "projects" if they meet the project-inclusion criteria)
    6. Education (from "education")
    7. Certifications (from "certifications")

- CAREER LEVEL WRITING RULES:
  * Beginner (0–1 years): STRICTLY avoid leadership claims, management terms, or grand strategy claims. Emphasize learning rapid capacity, execution support, and collaborative team contribution. Avoid inflated metrics or impact.
  * Junior (1–3 years): Confident but grounded. Emphasize execution task points, direct contributions, and collaboration. STRICTLY avoid senior leadership or high-altitude manager language.
  * Mid-Level (3–5 years): Emphasize ownership, self-directed initiatives, design/tech system maintenance, and measurable individual impact. Moderate strategic language is allowed.
  * Senior (5–8 years): Emphasize complex strategic thinking, modular system design, design system governance, mentorship of junior paths, and cross-functional leadership.
  * Lead (8+ years): High-altitude business impact, organizational influence, global team/product leadership, roadmap definition, and cross-functional alignment.

- WRITING STRENGTH STYLE RULES:
  * Conservative style: Use the safest and most literal phrasing. Strict historical alignment, zero extrapolation of responsibilities or tasks.
  * Balanced style: Polished, refined, elegant, but entirely realistic and authentic formatting.
  * Competitive style: Most persuasive version without lying. High salesmanship, rich active verbs, prioritizing strategic impact and ambition context.

- INTELLECTUAL HARD RULES (MUST BE OBEYED):
  1. Never invent fake metrics or exaggerate stats. Keep quantitative data grounded and defendable.
  2. Never fabricate fake achievements or roles.
  3. Never overstate candidate seniority beyond the calibrated choice.
  4. Never use claims, methodologies or tools that the candidate cannot defend confidently in an interview.

Follow these core service features requirements:
1. MATCH SCORE: Calculate a genuine, strategic compatibility percentage (0 to 100) based on required skills, alignment of experiences, and scope mismatch. Be objective.
2. RESUME IMPROVEMENTS: Locate 3-5 weak, task-oriented or vague bullet points in the resume (for example: "designed app screens", "wrote python scripts", "helped manage database"). Rewrite these achievements using professional action verbs, action-impact framing, and realistic quantitative metrics (e.g. "Designed 30+ responsive app screens that improved user onboarding conversion by 18%", "Architected modular Python web APIs automating ingestion for 200k daily records"). In the "impact" explain the structural optimization you applied.
3. RESUME STYLE RECOMMENDATION: Identify the company's organizational persona based on the target job description:
   - "Startup": Highlights quick execution, extreme versatility, direct impact, end-to-end building, features, and ownership.
   - "Enterprise": Highlights mature structured process-driven mindsets, scale, complex architecture, standards compliance, cross-functional collaboration, and metric tracking.
   - "Agency": Highlights high creativity, presentation skills, consulting, client-facing experiences, rapid multi-project workflows, and speed-to-market.
   Describe exactly why you assigned this company type and detail the narrative voice strategies you made to align the tailored resume.

4. OPTIMIZED RESUME STRUCTURE & DETAILS: Provide both a clean Markdown representation and a highly structured JSON representation of the resume. 
   Include:
   - "tools" (specific software, tools, developer utilities, languages, or environments key to this persona)
   - "certifications" (certifications, professional courses, training, or accreditations)
   Recommend one of two ATS templates:
   - Recommend "Standard" (Standard Resume) if companyType is "Enterprise".
   - Recommend "Portfolio" (Portfolio Resume) if companyType is "Startup" or "Agency".
   Explain the custom strategy reason in "recommendationReason".

5. PERSONALIZED COVER LETTER: Generate a professional, compelling cover letter (stored as "coverLetterText") that perfectly bridges the candidate's experience with the job description. It must be structured with:
   - A professional Greeting
   - Introduction stating the role interested in
   - Body paragraph 1: Why the candidate is an excellent fit for this specific job
   - Body paragraph 2: Specific relevant achievements tailored with quantitative metrics to match the role requirements
   - Professional closing and sign-off.
   Keep it highly realistic, personal, and impactful without fake placeholder brackets inside the letter—make it draft-ready.`;

      // Declare Response Schema
      const analysisResponseSchema = {
        type: Type.OBJECT,
        properties: {
          matchScore: {
            type: Type.INTEGER,
            description: "Calculated alignment score from 0 to 100 matching resume credentials with job expectations."
          },
          companyType: {
            type: Type.STRING,
            description: "Must be exactly: 'Startup', 'Enterprise', or 'Agency'."
          },
          companyDescription: {
            type: Type.STRING,
            description: "An elegant professional explanation of why this company was categorized as such, and how the resume's voice, pacing, and keywords have been pivoted to fit this persona."
          },
          missingKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of high-priority keywords, methodologies, tools, or domain experience present in the Job Description but noticeably missing from the Resume."
          },
          strengths: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Top 3-4 powerful alignments where the candidate matches or exceeds the role's specifications."
          },
          optimizations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                before: { type: Type.STRING, description: "The original weak or task-focused bullet point from the resume." },
                after: { type: Type.STRING, description: "The optimized, metric-driven, impact-oriented rewrite." },
                impact: { type: Type.STRING, description: "Short explanation of why this optimization works (e.g. 'Flipped from task descriptions to metric-centric outcomes')." }
              },
              required: ["before", "after", "impact"]
            },
            description: "3 to 5 clear contrast comparisons of rewritten accomplishment bullets."
          },
          tailoredResume: {
            type: Type.STRING,
            description: "The full, bespoke, tailored resume formatted in premium, clean Markdown. Ensure proper section hierarchy, matching the company persona."
          },
          tailoredResumeStructure: {
            type: Type.OBJECT,
            description: "Highly structured breakdown of the tailored qualifications for custom Template component renders.",
            properties: {
              name: { type: Type.STRING, description: "Candidate Full Name" },
              contactInfo: { type: Type.STRING, description: "Comprehensive flat contact bar, e.g., 'email@domain.com | +1 555-0199 | City, State | linkedin.com/in/username'" },
              summary: { type: Type.STRING, description: "Highly aligned professional summary paragraph adjusted for the target persona." },
              experiences: {
                type: Type.ARRAY,
                description: "3-4 key professional job experiences",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    role: { type: Type.STRING, description: "Target aligned job title" },
                    company: { type: Type.STRING, description: "Company or Project Name" },
                    duration: { type: Type.STRING, description: "Employment terms date, e.g. 'Jan 2024 - Present' or '2021 - 2023'" },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "3-4 outcome-centric optimized bullet descriptions containing metrics and active terminology."
                    }
                  },
                  required: ["role", "company", "duration", "bulletPoints"]
                }
              },
              projects: {
                type: Type.ARRAY,
                description: "Key product or development projects",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Project Title" },
                    description: { type: Type.STRING, description: "One-liner of what the project accomplished" },
                    bulletPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: "1-2 focused impact achievement points"
                    }
                  },
                  required: ["name", "description", "bulletPoints"]
                }
              },
              skills: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Highly relevant hard-skill, framework, technology, and methodology keywords."
              },
              tools: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of tools, libraries, development software or utilities. Crucial for Portfolio Resume layout."
              },
              certifications: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Accreditations, courses or standard certifications. Valuable for Corporate/Standard Resume."
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    degree: { type: Type.STRING, description: "Education degree name, e.g. 'B.S. Computer Science'" },
                    school: { type: Type.STRING, description: "University or institution name" },
                    year: { type: Type.STRING, description: "Graduation year, e.g. '2022' or 'Expected 2026'" }
                  },
                  required: ["degree", "school", "year"]
                }
              }
            },
            required: ["name", "contactInfo", "summary", "experiences", "projects", "skills", "education"]
          },
          coverLetterText: {
            type: Type.STRING,
            description: "Formated cover letter text with greeting, introduction block, body of fit, accomplishments, and professional sign-off. Highly customized without placeholders."
          },
          recommendedTemplate: {
            type: Type.STRING,
            description: "Must be exactly 'Standard' or 'Portfolio'."
          },
          recommendationReason: {
            type: Type.STRING,
            description: "Elaborate professional reason for recommending this template based on role requirements & styling fit."
          },
          strategicSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 direct tactical action advices regarding how to frame their upcoming conversation, apply keywords, or supplement their application."
          },
          extractedJobTitle: {
            type: Type.STRING,
            description: "Extracted Job Title from the target Job Description (e.g. 'Product Designer' or 'Lead Engineer'). Keep it short and under 40 characters."
          },
          extractedCompanyName: {
            type: Type.STRING,
            description: "Extracted Target Company Name from the target Job Description (e.g. 'YipitData' or 'xfive'). If not specified in the description, write 'Strategic Application'."
          }
        },
        required: [
          "matchScore",
          "companyType",
          "companyDescription",
          "missingKeywords",
          "strengths",
          "optimizations",
          "tailoredResume",
          "tailoredResumeStructure",
          "coverLetterText",
          "recommendedTemplate",
          "recommendationReason",
          "strategicSuggestions",
          "extractedJobTitle",
          "extractedCompanyName"
        ]
      };

      let response;
      try {
        console.log("[Roleva Server] Dispatching primary analysis request via gemini-3.5-flash...");
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contentsParts,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: analysisResponseSchema
          }
        });
      } catch (firstError: any) {
        console.warn("[Roleva Server] Primary model generation encountered error, evaluating fallback suitability:", firstError);
        const errorMsg = String(firstError?.message || firstError?.status || firstError || "").toLowerCase();

        // Check if error represents a transient overload or demand spike exception (503, unavailable, limits, busy, overloaded)
        const isUnavailable = 
          errorMsg.includes("503") || 
          errorMsg.includes("unavailable") || 
          errorMsg.includes("high demand") || 
          errorMsg.includes("spikes") || 
          errorMsg.includes("overloaded") || 
          errorMsg.includes("busy") || 
          errorMsg.includes("quota") || 
          errorMsg.includes("limit") || 
          errorMsg.includes("exhausted");

        if (isUnavailable) {
          console.log("[Roleva Server] Primary model unavailable. Initiating graceful fallback recovery with highly stable 'gemini-3.1-flash-lite'...");
          try {
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite", // Reliable non-deprecated lite model for structural text logic
              contents: contentsParts,
              config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisResponseSchema
              }
            });
          } catch (secondError: any) {
            console.error("[Roleva Server] Gracious fallback 'gemini-3.1-flash-lite' failed too:", secondError);
            throw new Error(`The resume intelligence model is experiencing high demand. Please try again in a few moments. Details: ${secondError.message || secondError}`);
          }
        } else {
          // It's a genuine operational/syntax error, propagate
          throw firstError;
        }
      }

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response received from Gemini.");
      }

      const cleanJson = responseText.trim();
      const resultObj = JSON.parse(cleanJson);
      return res.json(resultObj);

    } catch (error: any) {
      console.error("Analysis API Error:", error);
      return res.status(500).json({
        error: error.message || "An unexpected error occurred during the resume analysis. Please try again."
      });
    }
  });

  // API Endpoint: Dynamic Print-ready Frame generator to bypass iframe sandbox window.print() constraints
  app.post("/api/print", (req, res) => {
    const { type, template, resumeDataJson, coverLetterText } = req.body;

    let htmlContent = "";

    if (type === "resume" || type === "all") {
      let struct: any;
      try {
        struct = JSON.parse(resumeDataJson);
      } catch (e) {
        return res.status(400).send("Invalid Resume Data JSON");
      }

      const isClassic = template === "Classic" || template === "Standard";
      const candidateName = struct.name || "Candidate";
      const contactInfo = struct.contactInfo || "";
      const formattedLetter = coverLetterText ? coverLetterText.replace(/\\n/g, "<br>").replace(/\n/g, "<br>") : "";

      const getResumeHtml = () => `
        <div class="page-container ${isClassic ? 'font-classic' : 'font-modern'}">
          <div class="${isClassic ? 'header-classic' : 'header-modern'}">
            <h1 class="name">${struct.name}</h1>
            <div class="contact">${struct.contactInfo}</div>
          </div>

          ${isClassic ? `
            <!-- CLASSIC ATS TEMPLATE (Name, Contact, Summary, Skills, Experience, Projects, Education, Certifications) -->
            <div class="section-title">Professional Summary</div>
            <p class="summary">${struct.summary || ""}</p>

            <div class="section-title">Skills & Competencies</div>
            <div class="skills-block">${struct.skills ? struct.skills.join(" • ") : ""}</div>

            <div class="section-title">Professional Experience</div>
            ${struct.experiences ? struct.experiences.map((exp: any) => `
              <div class="item-block">
                <div class="item-header">
                  <span class="item-title">${exp.role} <span class="divider">|</span> <span class="item-subtitle">${exp.company}</span></span>
                  <span class="item-date">${exp.duration}</span>
                </div>
                <ul>
                  ${exp.bulletPoints ? exp.bulletPoints.map((b: any) => `<li>${b}</li>`).join("") : ""}
                </ul>
              </div>
            `).join("") : ""}

            ${struct.projects && struct.projects.length > 0 ? `
              <div class="section-title">Selected Projects</div>
              ${struct.projects.map((proj: any) => `
                <div class="item-block">
                  <div class="project-header">
                    <span class="item-title">${proj.name}</span>
                    <span class="item-desc">— ${proj.description}</span>
                  </div>
                  <ul>
                    ${proj.bulletPoints ? proj.bulletPoints.map((b: any) => `<li>${b}</li>`).join("") : ""}
                  </ul>
                </div>
              `).join("")}
            ` : ""}

            <div class="section-title">Education</div>
            ${struct.education ? struct.education.map((edu: any) => `
              <div class="item-header" style="margin-top: 5px; margin-bottom: 5px;">
                <span class="item-title">${edu.degree} <span style="font-weight: normal; color: #475569; font-size: 11px;">— ${edu.school}</span></span>
                <span class="item-date">${edu.year}</span>
              </div>
            `).join("") : ""}

            ${struct.certifications && struct.certifications.length > 0 ? `
              <div class="section-title">Certifications</div>
              <div class="skills-block">${struct.certifications.join(" • ")}</div>
            ` : ""}

          ` : `
            <!-- MODERN ATS TEMPLATE (Name, Contact, Profile, Projects, Experience, Skills, Education) -->
            <div class="section-title">Profile</div>
            <p class="summary">${struct.summary || ""}</p>

            ${struct.projects && struct.projects.length > 0 ? `
              <div class="section-title">Projects</div>
              ${struct.projects.map((proj: any) => `
                <div class="item-block">
                  <div class="project-header">
                    <span class="item-title">${proj.name}</span>
                    <span class="item-desc">— ${proj.description}</span>
                  </div>
                  <ul>
                    ${proj.bulletPoints ? proj.bulletPoints.map((b: any) => `<li>${b}</li>`).join("") : ""}
                  </ul>
                </div>
              `).join("")}
            ` : ""}

            <div class="section-title">Experience</div>
            ${struct.experiences ? struct.experiences.map((exp: any) => `
              <div class="item-block">
                <div class="item-header">
                  <span class="item-title">${exp.role} <span class="divider">@</span> <span class="item-subtitle-modern">${exp.company}</span></span>
                  <span class="item-date">${exp.duration}</span>
                </div>
                <ul>
                  ${exp.bulletPoints ? exp.bulletPoints.map((b: any) => `<li>${b}</li>`).join("") : ""}
                </ul>
              </div>
            `).join("") : ""}

            <div class="section-title">Skills</div>
            <div class="skills-block"><strong>Core Specialties:</strong> ${struct.skills ? struct.skills.join(" • ") : ""}</div>
            ${struct.tools && struct.tools.length > 0 ? `
              <div class="skills-block" style="margin-top: 4px;"><strong>Tools & Technologies:</strong> ${struct.tools.join(" • ")}</div>
            ` : ""}

            <div class="section-title">Education</div>
            ${struct.education ? struct.education.map((edu: any) => `
              <div class="item-header" style="margin-top: 5px; margin-bottom: 5px;">
                <span class="item-title">${edu.degree} <span style="font-weight: normal; color: #475569; font-size: 11px;">— ${edu.school}</span></span>
                <span class="item-date">${edu.year}</span>
              </div>
            `).join("") : ""}
          `}
        </div>
      `;

      const getCoverLetterHtml = () => `
        <div class="page-container font-modern">
          <div class="header-modern">
            <h1 class="name">${candidateName}</h1>
            <div class="contact">${contactInfo}</div>
          </div>
          <div class="date" style="font-size: 11.5px; color: #64748b; margin-bottom: 24px; font-family: sans-serif;">
            Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div class="letter-content" style="font-family: sans-serif; font-size: 12.5px; color: #1e293b; text-align: justify; line-height: 1.6; whitespace: pre-line;">
            ${formattedLetter}
          </div>
        </div>
      `;

      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>${candidateName} - Application Documents</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm 20mm 20mm 20mm;
            }
            @media print {
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
              .page-break {
                page-break-before: always !important;
                break-before: page !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              color: #0f172a;
              margin: 0;
              padding: 40px 0;
              line-height: 1.55;
            }
            .page-container {
              max-width: 800px;
              margin: 0 auto 30px auto;
              background: #ffffff;
              padding: 50px 60px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
              border-radius: 8px;
              box-sizing: border-box;
            }
            @media print {
              body {
                padding: 0;
                background: #ffffff !important;
              }
              .page-container {
                box-shadow: none;
                padding: 0;
                margin: 0 0 35px 0;
                max-width: 100%;
              }
            }
            .font-classic {
              font-family: "Times New Roman", Times, Georgia, serif;
            }
            .font-classic .name {
              text-transform: uppercase;
              color: #111111;
            }
            .font-classic .section-title {
              border-bottom: 1.5px solid #111111;
              color: #111111;
            }
            .font-modern {
              font-family: system-ui, -apple-system, sans-serif;
            }
            .font-modern .name {
              color: #0f172a;
            }
            .font-modern .section-title {
              border-bottom: 1px solid #e2e8f0;
              color: #4338ca;
            }
            .header-classic {
              text-align: center;
              border-bottom: 2px solid #111111;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header-modern {
              text-align: left;
              border-bottom: 2.5px solid #4f46e5;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .name {
              font-size: 26px;
              font-weight: 800;
              margin: 0;
              letter-spacing: -0.5px;
            }
            .contact {
              font-size: 11.5px;
              color: #475569;
              margin-top: 8px;
              line-height: 1.55;
            }
            .section-title {
              font-size: 13.5px;
              font-weight: 800;
              text-transform: uppercase;
              padding-bottom: 4px;
              margin-top: 26px;
              margin-bottom: 12px;
              letter-spacing: 0.75px;
            }
            .summary {
              font-size: 11.5px;
              text-align: justify;
              margin: 0 0 16px 0;
              color: #334155;
              line-height: 1.6;
            }
            .skills-block {
              font-size: 11px;
              margin-bottom: 14px;
              line-height: 1.6;
              color: #334155;
            }
            .item-block {
              margin-bottom: 16px;
            }
            .item-header {
              display: flex;
              justify-content: space-between;
              align-items: baseline;
              margin-top: 10px;
              margin-bottom: 4px;
            }
            .project-header {
              margin-top: 10px;
              margin-bottom: 4px;
              line-height: 1.45;
            }
            .item-desc {
              font-size: 11px;
              font-style: italic;
              color: #475569;
              margin-left: 6px;
            }
            .item-title {
              font-size: 12px;
              font-weight: bold;
              color: #0f172a;
            }
            .divider {
              font-weight: normal;
              color: #cbd5e1;
            }
            .item-subtitle {
              font-style: italic;
              color: #475569;
            }
            .item-subtitle-modern {
              color: #4338ca;
              font-weight: 600;
            }
            .item-date {
              font-size: 10.5px;
              font-family: monospace;
              color: #64748b;
            }
            .divider-point {
              color: #e2e8f0;
              margin: 0 6px;
            }
            ul {
              margin: 4px 0 8px 0;
              padding-left: 20px;
            }
            li {
              font-size: 11px;
              margin-bottom: 5px;
              text-align: justify;
              color: #334155;
              line-height: 1.55;
            }
            .banner-alert {
              max-width: 800px;
              margin: 0 auto 20px auto;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 12px 18px;
              border-radius: 12px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 13px;
              color: #166534;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .btn-print-trigger {
              background: #16a34a;
              color: white;
              border: none;
              padding: 8px 16px;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12.5px;
              transition: background 0.2s;
            }
            .btn-print-trigger:hover {
              background: #15803d;
            }
          </style>
        </head>
        <body>
          <div class="banner-alert no-print">
            <div>
              <strong>Secure ATS Export Console</strong><br>
              Choose <strong>"Save as PDF"</strong> as your destination in the print dialogue below to download yourcomplete files.
            </div>
            <button class="btn-print-trigger" onclick="window.print()">Export Adobe PDF Now</button>
          </div>

          ${type === "all" ? `
            <!-- Combined Package -->
            ${getCoverLetterHtml()}
            <div class="page-break"></div>
            ${getResumeHtml()}
          ` : `
            <!-- Single Document -->
            ${getResumeHtml()}
          `}

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `;
    } else if (type === "coverletter") {
      const formattedText = coverLetterText ? coverLetterText.replace(/\\n/g, "<br>").replace(/\n/g, "<br>") : "";
      const candidateName = req.body.candidateName || "Candidate";
      const contactInfo = req.body.contactInfo || "";

      htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Cover Letter - ${candidateName}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 20mm 20mm 20mm 20mm;
            }
            @media print {
              body {
                background: #ffffff !important;
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .no-print {
                display: none !important;
              }
            }
            body {
              font-family: system-ui, -apple-system, sans-serif;
              background: #f8fafc;
              color: #0f172a;
              margin: 0;
              padding: 30px 0;
              line-height: 1.5;
            }
            .page-container {
              max-width: 800px;
              margin: 0 auto;
              background: #ffffff;
              padding: 55px 60px;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
              border-radius: 8px;
              box-sizing: border-box;
            }
            @media print {
              body {
                padding: 0;
                background: #ffffff !important;
              }
              .page-container {
                box-shadow: none;
                padding: 0;
                margin: 0;
                max-width: 100%;
              }
            }
            .header-modern {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 14px;
              margin-bottom: 25px;
            }
            .name {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #1e1b4b;
            }
            .contact {
              font-size: 11px;
              color: #475569;
              margin-top: 6px;
            }
            .date {
              font-size: 11.5px;
              color: #64748b;
              margin-bottom: 20px;
            }
            .letter-content {
              font-size: 12.5px;
              color: #334155;
              text-align: justify;
            }
            .banner-alert {
              max-width: 800px;
              margin: 0 auto 20px auto;
              background: #f0fdf4;
              border: 1px solid #bbf7d0;
              padding: 12px 18px;
              border-radius: 12px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 13px;
              color: #166534;
              display: flex;
              justify-content: space-between;
              align-items: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .btn-print-trigger {
              background: #16a34a;
              color: white;
              border: none;
              padding: 8px 16px;
              font-weight: bold;
              border-radius: 8px;
              cursor: pointer;
              font-size: 12.5px;
              transition: background 0.2s;
            }
            .btn-print-trigger:hover {
              background: #15803d;
            }
          </style>
        </head>
        <body>
          <div class="banner-alert no-print">
            <div>
              <strong>Secure ATS Export Console</strong><br>
              Choose <strong>"Save as PDF"</strong> as your destination in the print dialogue below to download your tailored cover letter.
            </div>
            <button class="btn-print-trigger" onclick="window.print()">Export Adobe PDF Now</button>
          </div>

          <div class="page-container">
            <div class="header-modern">
              <h1 class="name">${candidateName}</h1>
              <div class="contact">${contactInfo}</div>
            </div>
            
            <div class="date">Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>

            <div class="letter-content" style="white-space: pre-line; line-height: 1.6;">
              ${formattedText}
            </div>
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            };
          </script>
        </body>
        </html>
      `;
    }

    res.send(htmlContent);
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA Fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Roleva Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || "development"} mode.`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
