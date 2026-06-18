import type { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";

export default async function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
          console.error("[Roleva Vercel API] Mammoth parsing failed:", mammothErr);
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

    console.log("[Roleva Vercel API] Extracting resume data via gemini-3.5-flash...");
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
    return res.json(parsedJSON);
  } catch (err: any) {
    console.error("[Roleva Vercel API] Extract endpoint failed:", err);
    return res.status(500).json({ error: err?.message || "Internal server error during extraction." });
  }
}
