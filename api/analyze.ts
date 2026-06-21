import type { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { resumeText, resumePdf, structuredResume, jobDescription, careerLevel = "Junior (1–3 years)", writingStyle = "Balanced" } = req.body;

    if (!jobDescription || (!resumeText && !resumePdf && !structuredResume)) {
      return res.status(400).json({
        error: "Missing required inputs. Please provide a job description and a resume."
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const ai = new GoogleGenAI({
      apiKey
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

    // Resilient Exponential Backoff Retry engine inside analyze
    const executeWithRetry = async (modelName: string, maxRetries = 3, initialDelayMs = 1000) => {
      let attempt = 0;
      while (true) {
        try {
          return await ai.models.generateContent({
            model: modelName,
            contents: contentsParts,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: analysisResponseSchema
            }
          });
        } catch (error: any) {
          attempt++;
          const errorMsg = String(error?.message || error?.status || error || "").toLowerCase();
          const isTransient = 
            errorMsg.includes("503") || 
            errorMsg.includes("500") || 
            errorMsg.includes("unavailable") || 
            errorMsg.includes("overloaded") || 
            errorMsg.includes("rate") || 
            errorMsg.includes("limit") || 
            errorMsg.includes("quota") || 
            errorMsg.includes("busy") ||
            errorMsg.includes("demand");

          if (attempt > maxRetries || !isTransient) {
            throw error;
          }
          
          const delay = initialDelayMs * Math.pow(2, attempt - 1);
          console.warn(`[Roleva Vercel API] Gemini ${modelName} call failed (Transient). Retrying attempt ${attempt}/${maxRetries} in ${delay}ms. Error: ${error?.message || error}`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    };

    let response;
    try {
      console.log("[Roleva Vercel API] Dispatching primary analysis request via gemini-3.5-flash (with robust retry)...");
      response = await executeWithRetry("gemini-3.5-flash", 3, 1000);
    } catch (firstError: any) {
      console.warn("[Roleva Vercel API] Primary model generation encountered persistent errors, evaluating fallback suitability:", firstError);
      const errorMsg = String(firstError?.message || firstError?.status || firstError || "").toLowerCase();

      // Check if error represents a transient overload or demand spike exception
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
        console.log("[Roleva Vercel API] Primary model unavailable after retries. Initiating stable 'gemini-3.1-flash-lite' fallback (with retry resilience)...");
        try {
          response = await executeWithRetry("gemini-3.1-flash-lite", 2, 1000);
        } catch (secondError: any) {
          console.error("[Roleva Vercel API] Gracious fallback 'gemini-3.1-flash-lite' failed too:", secondError);
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
}
