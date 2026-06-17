export type CompanyPersonality = 'Startup' | 'Enterprise' | 'Agency';

export interface BulletOptimization {
  before: string;
  after: string;
  impact: string; // Explanation of what was improved (e.g., added metrics, action verb, etc.)
}

export interface ResumeSectionExperience {
  role: string;
  company: string;
  duration: string;
  bulletPoints: string[];
}

export interface ResumeSectionProject {
  name: string;
  description: string;
  bulletPoints: string[];
}

export interface ResumeEducation {
  degree: string;
  school: string;
  year: string;
}

export interface ResumeStructure {
  name: string;
  contactInfo: string; // e.g. "email | phone | location | github"
  summary: string;
  experiences: ResumeSectionExperience[];
  projects: ResumeSectionProject[];
  skills: string[];
  tools?: string[]; // Tools used (essential for Portfolio Template)
  certifications?: string[]; // Certifications (great for Standard Template)
  education: ResumeEducation[];
}

export interface AnalysisResult {
  matchScore: number;
  companyType: CompanyPersonality;
  companyDescription: string;
  missingKeywords: string[];
  strengths: string[];
  optimizations: BulletOptimization[];
  tailoredResume: string; // Markdown formatted tailored resume text
  tailoredResumeStructure: ResumeStructure; // Structured block for high-fidelity template rendering
  coverLetterText: string; // Generated personalized cover letter featuring Greeting, Intro, Fit, Achievements, Closing
  strategicSuggestions: string[];
  recommendedTemplate: 'Standard' | 'Portfolio';
  recommendationReason: string;
  extractedJobTitle?: string;
  extractedCompanyName?: string;
}
