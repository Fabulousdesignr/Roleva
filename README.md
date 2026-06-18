# Roleva

AI-powered resume intelligence platform that helps job seekers optimize resumes, analyze job fit, improve ATS performance, and generate tailored cover letters for every application.

---

## Overview

Roleva was built from a personal problem.

While applying for jobs, I realized using the same resume for every opportunity was hurting my chances. Different companies prioritize different skills, experiences, and keywords, and manually tailoring a CV for every application is exhausting and time-consuming.

Roleva solves that problem.

Users upload their base resume once, paste a job description, and Roleva analyzes both to generate a stronger, role-specific application package.

The platform helps users:

- Improve resume structure
- Optimize for ATS systems
- Measure job match score
- Rewrite weak bullet points
- Identify missing keywords
- Generate tailored cover letters

---

## Problem

Job seekers often struggle with:

- Sending the same CV to multiple companies
- Low ATS visibility
- Weak resume bullet points
- Poor alignment with job descriptions
- Spending too much time tailoring applications manually

Most applicants do not know why they are being rejected.

---

## Solution

Roleva acts as an AI career assistant.

The workflow:

1. Upload resume (PDF or DOCX)
2. Resume is parsed and structured
3. User pastes job description
4. AI analyzes fit and gaps
5. Roleva generates:
   - ATS score
   - Match score
   - Optimized resume
   - Tailored cover letter
   - Improvement recommendations

This reduces resume customization from over an hour to minutes.

---

## Core Features

### Resume Extraction
Parses uploaded PDF/DOCX resumes into structured data.

Extracts:
- Personal information
- Skills
- Experience
- Education
- Certifications

---

### ATS Optimization
Analyzes whether the resume aligns with ATS systems.

Checks:
- Keyword alignment
- Section structure
- Formatting quality
- Missing requirements

---

### Match Score Analysis
Compares candidate profile against a job description.

Returns:
- Overall match percentage
- Strength areas
- Missing skills
- Recommendation insights

---

### AI Resume Rewriting
Improves weak resume content without exaggerating experience.

Roleva follows strict rules:
- No fake achievements
- No invented metrics
- No false seniority inflation

The goal is authenticity with stronger positioning.

---

### Cover Letter Generation
Creates personalized cover letters based on:

- Candidate profile
- Job description
- Company context

Each letter is tailored for the role.

---

### Export & Delivery
Users receive downloadable application materials including:

- Optimized Resume (ATS Template 1)
- Optimized Resume (ATS Template 2)
- Tailored Cover Letter
- Match Report

---

## Tech Stack

### Frontend
- React
- TypeScript
- Vite

### Backend
- Vercel Serverless Functions
- Node.js

### AI
- Google Gemini API

### File Processing
- PDF Parsing
- DOCX Parsing
- Mammoth

### Deployment
- Vercel
- GitHub

---

## Architecture

```text
User Uploads Resume
↓
Extract Resume Content
↓
Convert to Structured JSON
↓
User Inputs Job Description
↓
Gemini Analysis
↓
Generate:
- Match Score
- Resume Improvements
- Cover Letter
↓
Render ATS Templates
↓
Export Final Documents
```

---

## Challenges I Faced

This project pushed me deeply into engineering territory.

Major challenges included:

- Vercel serverless deployment
- ESM vs CommonJS package conflicts
- PDF parsing reliability
- AI response structuring
- Managing Gemini API limitations
- Exporting clean printable resume documents

One major lesson was understanding how much product quality depends on architecture decisions, not just interface design.

---

## Lessons Learned

Roleva taught me that building AI products is not just about calling an API.

The real work is in:

- defining workflows
- handling edge cases
- building trust
- structuring outputs
- designing around AI limitations

As a designer, this project expanded how I think about products.

I now think beyond screens and into systems, constraints, logic, and deployment.

---

## Why I Built This

Roleva started as a personal solution.

I built it during my own job search to improve how I applied for opportunities.

Instead of treating AI as a gimmick, I wanted to build something genuinely useful.

This product helped me better understand:
- my strengths
- my gaps
- how to position myself better

And it became one of the most meaningful AI products I have built.

---

## Live Demo

[Try Roleva](https://roleva.vercel.app)

---

## Creator

Built by **Godwin (Fabulous Designer)**  
Product Designer • AI Product Builder
