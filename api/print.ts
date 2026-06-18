import type { Request, Response } from "express";

export default function handler(req: Request, res: Response) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

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
            Choose <strong>"Save as PDF"</strong> as your destination in the print dialogue below to download your complete files.
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

  return res.send(htmlContent);
}
