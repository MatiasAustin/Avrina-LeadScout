import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import mammoth from "mammoth";
import { Platform, SearchStrategy, LeadAnalysis, OutreachDraft, UserProfile, PositioningSuggestion, OutreachTone, OutreachLength, CvAnalysisResult } from "../types";

// Helper to get client
const getAiClient = () => {
  // 1. Static call for Vite
  // @ts-ignore
  let apiKey = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env.VITE_API_KEY : '';
  
  // 2. Fallback for Node/process.env
  if (!apiKey) {
    try {
      apiKey = process.env.VITE_API_KEY || process.env.API_KEY || process.env.GEMINI_API_KEY || '';
    } catch (e) {}
  }

  if (!apiKey) {
    throw new Error("API Key is missing. Please set the VITE_API_KEY environment variable.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * RETRY HELPER: Handles 503 (Overloaded) and 429 (Rate Limit) errors
 * automatically using exponential backoff.
 */
const runWithRetry = async <T>(
  operation: () => Promise<T>, 
  retries = 3, 
  delay = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    const errMsg = error?.message || JSON.stringify(error);
    const isTransient = errMsg.includes('503') || 
                        errMsg.includes('overloaded') || 
                        errMsg.includes('UNAVAILABLE') || 
                        errMsg.includes('429') ||
                        errMsg.includes('Quota');

    if (retries > 0 && isTransient) {
      console.warn(`AI Model Busy/Rate Limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return runWithRetry(operation, retries - 1, delay * 2);
    }
    
    // Format user-friendly errors
    if (errMsg.includes('429') || errMsg.includes('Quota')) {
      throw new Error("AI Model Quota Exceeded (429). The system has reached its request limit. Please update the API key or check Google AI Studio billing.");
    }
    if (errMsg.includes('403') || errMsg.includes('API_KEY_INVALID')) {
      throw new Error("Invalid API Key (403). Please verify your Google API configuration.");
    }
    if (errMsg.includes('400')) {
      throw new Error("Bad Request (400). The AI could not process the format of this file or request.");
    }
    if (errMsg.includes('{')) {
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error && parsed.error.message) throw new Error(parsed.error.message);
      } catch (e) {}
    }
    
    throw new Error(errMsg.length > 200 ? errMsg.substring(0, 200) + "..." : errMsg);
  }
};

/**
 * Helper: Convert File to Base64 string
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:mime/type;base64, prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Helper: Read File as ArrayBuffer (for Mammoth)
 */
const fileToArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = error => reject(error);
  });
};

/**
 * Parse Resume/CV from File (Images, PDF, DOCX)
 */
export const parseResumeFromFile = async (file: File): Promise<string> => {
  const ai = getAiClient();
  const fileType = file.type;

  let prompt = `
    Analyze this CV/Resume.
    
    Task:
    Extract and summarize the user's core Professional Profile into a concise but detailed paragraph (max 100 words).
    Focus on:
    1. Their main Job Title/Role.
    2. Key Hard Skills (e.g. React, SEO, Video Editing).
    3. Years of Experience or Seniority Level.
    4. Notable Achievements or Specialized Niches.

    Output ONLY the summary text, written in first person ("I am a..."). 
    Do not include markdown formatting or bullet points.
  `;

  // 1. Handle DOCX (Extract Text Client-Side)
  if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.endsWith('.docx')) {
    try {
      const arrayBuffer = await fileToArrayBuffer(file);
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value;
      
      // Send extracted text to Gemini with Retry
      const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `
          CONTEXT: The following is text extracted from a user's resume (DOCX format).
          ${prompt}
          
          RESUME TEXT:
          ${extractedText}
        `
      }));
      return response.text ? response.text.trim() : "";
    } catch (e) {
      console.error("DOCX parsing error:", e);
      throw new Error("Failed to read DOCX file. Please try a PDF or Image instead.");
    }
  }

  // 2. Handle PDF & Images (Send Base64 to Gemini)
  // Gemini 1.5/2.5 Flash supports application/pdf and images natively in inlineData
  try {
    const base64Data = await fileToBase64(file);
    
    // Wrap with Retry
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { 
            inlineData: { 
              mimeType: fileType, 
              data: base64Data 
            } 
          },
          { text: prompt }
        ]
      }
    }));

    if (response.text) {
      return response.text.trim();
    }
    throw new Error("Could not analyze file");
  } catch (error) {
    console.error("Error parsing file:", error);
    throw error;
  }
};

/**
 * Generate Positioning/Bio Suggestions
 */
export const generatePositioningSuggestions = async (
  jobTitle: string,
  niche: string
): Promise<PositioningSuggestion[]> => {
  const ai = getAiClient();
  
  const prompt = `
    I am a "${jobTitle}" targeting the "${niche || 'General Market'}" niche.
    
    Task: 
    Create 3 distinct professional positioning statements (Bio) for my social media profiles (LinkedIn/Twitter/Instagram) to attract clients.
    
    1. The Specialist (Focus on niche authority)
    2. The Problem Solver (Focus on pain points solved)
    3. The Outcome Driven (Focus on ROI/Results)
    
    Keep them punchy, professional, and under 280 characters.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      suggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, description: "Style of the positioning (e.g. Authority)" },
            statement: { type: Type.STRING, description: "The actual bio text" },
            explanation: { type: Type.STRING, description: "Brief reason why this works" }
          },
          required: ["type", "statement", "explanation"]
        }
      }
    },
    required: ["suggestions"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      const data = JSON.parse(response.text);
      return data.suggestions as PositioningSuggestion[];
    }
    throw new Error("No positioning generated");
  } catch (error) {
    console.error("Error generating positioning:", error);
    throw error;
  }
};

/**
 * Step 1 & 2: Generate Niches (if needed) and Keywords
 */
export const generateSearchStrategy = async (
  jobTitle: string,
  platform: Platform,
  nicheInput: string,
  location: string,
  idealClient: string,
  userBio: string 
): Promise<SearchStrategy> => {
  const ai = getAiClient();
  
  const isGoogle = platform === Platform.Google;
  const isMaps = platform === Platform.GoogleMaps;
  const isInstagram = platform === Platform.Instagram;

  let platformInstructions = '';

  if (isGoogle) {
    platformInstructions = `
       IMPORTANT - GOOGLE WEB SEARCH ADVANCED OPERATORS MODE:
       You MUST utilize Google's advanced search operators to find hidden leads.
       - Use 'site:' to search specific platforms (e.g. site:linkedin.com/in/, site:instagram.com).
       - Use 'intitle:' to find specific page titles (e.g. intitle:"hiring", intitle:"our team").
       - Use 'inurl:' to find specific page structures (e.g. inurl:contact, inurl:portfolio).
       - Use 'filetype:' if relevant (e.g. filetype:pdf "request for proposal").
       - Use Boolean (AND, OR, -) to refine.
       
       Categories to generate for Google Web:
       - Direct Job Postings (e.g. intitle:"hiring" "${jobTitle}")
       - Decision Maker Profiles (e.g. site:linkedin.com/in/ "CEO" "${nicheInput}")
       - Company Contact Pages (e.g. site:.com inurl:contact "${nicheInput}")
       - "Looking for" queries (e.g. "looking for a ${jobTitle}")
    `;
  } else if (isMaps) {
    platformInstructions = `
      IMPORTANT - GOOGLE MAPS LOCAL SEO MODE:
      For Google Maps, we are looking for BUSINESSES that likely have problems a "${jobTitle}" can solve.
      
      The user is a "${jobTitle}" looking for clients ("${idealClient}") in "${location || "Local Area"}".
      
      Task:
      Generate 50+ specific keywords combining:
      1. Niche Business Categories (e.g. "Dental Clinic", "Coffee Shop", "Law Firm").
      2. Location modifiers (e.g. "${location}", "Near me", "Central Jakarta").
      3. Modifiers that might indicate they need help (e.g. "New opening", "Old business").
      
      Example if user is Web Dev:
      - "Restaurants with no website in ${location}"
    `;
  } else if (isInstagram) {
    platformInstructions = `
      IMPORTANT - INSTAGRAM KEYWORD SEARCH MODE (NOT JUST HASHTAGS):
      The user wants to find Potential Client Profiles (Brands/Businesses), not just random photos.
      
      Generate specific "Search Bar" phrases that real businesses use in their Name or Bio.
      
      Categories to generate:
      1. Specific Business Niches + Location (e.g. "Coffee Shop Jakarta", "Skincare Brand Indonesia").
      2. Decision Maker Titles (e.g. "Founder", "Owner", "CEO" + Niche).
      3. Competitor Analysis (e.g. Names of big brands in this niche to look at their followers).
      4. Pain Point Keywords (e.g. "Hiring Graphic Designer", "Rebranding").
      
      Do NOT just output hashtags (e.g. #coffee). Output full search phrases.
    `;
  } else {
    platformInstructions = `
       For ${platform}, generate native search queries:
       - Specific Hashtags (high and low volume)
       - Job Title searches
       - "Hiring" or "Looking for" posts
       - Competitor audience hacking
    `;
  }

  const prompt = `
    User Profile:
    - Role: "${jobTitle}"
    - Current Positioning/Bio/Resume Summary: "${userBio || "Generic freelancer"}"
    - Platform: "${platform}"
    - Target Location: "${location || "Global/Anywhere"}"
    - Ideal Client Persona: "${idealClient || "General Business Owners/Decision Makers"}"
    - Specific Context/Niche: "${nicheInput || "None provided"}"
    
    Task:
    1. If the niche is empty or generic, suggest 3 specific, high-potential niches tailored for this job on this platform.
    
    2. KEYWORD GENERATION (CRITICAL):
       Generate a MASSIVE list of specific search queries (Aim for 50-100+ keywords). 
       The keywords must help me find clients who need the specific value proposition described in my Bio/Resume ("${userBio}").
       
       ${platformInstructions}

    3. TIPS GENERATION (VERY IMPORTANT):
       Provide 3 short, actionable "Pro Tips" for identifying bad leads vs good leads specifically for a "${jobTitle}" on ${platform}.
       Do NOT give generic advice. 
       Example: If I am a Virtual Assistant, tell me to look for overwhelmed owners, NOT blurry photos (that is for designers).
       Example: If I am a Designer, tell me to look for pixelated logos.

    Return JSON.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      nicheSuggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of recommended niches"
      },
      keywords: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "A massive list of 50-100+ exact search queries/operators"
      },
      tips: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Job-specific tips for spotting high-quality leads on this platform"
      }
    },
    required: ["nicheSuggestions", "keywords", "tips"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text) as SearchStrategy;
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Error generating strategy:", error);
    throw error;
  }
};

export interface MediaItem {
  mimeType: string;
  data: string; // base64
}

/**
 * Scan Lead from Multiple Media (Images or Video)
 */
export const scanLeadFromMedia = async (
  mediaItems: MediaItem[],
  userJob: string
): Promise<{ notes: string; painPoints: string }> => {
  const ai = getAiClient();

  const prompt = `
    Analyze the provided media (Screenshots or Screen Recording video) of a potential client's social media profile or website.
    I work as a "${userJob}".

    Task 1 (Bio/Context): 
    Read the text visible in the media. Summarize who they are, what they sell, and their bio. Put this in 'notes'.
    If it's a video, observe the user flow or the scrolling content.

    Task 2 (Pain Points):
    Look at the VISUALS, UX (if video), and COPY. Identify 3 specific weaknesses or "Pain Points" that a "${userJob}" could fix.
    
    Examples:
    - Designer: Inconsistent fonts, bad mobile layout (if shown), low res images.
    - Developer: Slow loading (if video shows lag), broken elements, non-responsive design.
    - Marketer: Boring hook, no CTA, low engagement visible.
    
    Be specific. Do not be generic.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      notes: { type: Type.STRING, description: "Summary of who they are based on text/visuals" },
      painPoints: { type: Type.STRING, description: "List of observed visual, UX, or strategic weaknesses" }
    },
    required: ["notes", "painPoints"]
  };

  // Construct parts
  const parts = [
    ...mediaItems.map(item => ({
      inlineData: {
        mimeType: item.mimeType,
        data: item.data
      }
    })),
    { text: prompt }
  ];

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash", // 2.5 Flash is excellent for video/multimodal
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No scan results");
  } catch (error) {
    console.error("Error scanning media:", error);
    throw error;
  }
};

/**
 * Step 4: Analyze Lead Compatibility (Updated with Bio/CV Context)
 */
export const analyzeLeadPotential = async (
  leadData: { name: string; url: string; notes: string; painPoints: string },
  userProfile: UserProfile & { bio?: string } // Added bio optional
): Promise<LeadAnalysis> => {
  const ai = getAiClient();

  const prompt = `
    I am a "${userProfile.jobTitle}" specializing in "${userProfile.targetNiche}".
    
    MY RESUME / PROFESSIONAL BIO / SKILLS:
    "${userProfile.bio || "Standard professional with general skills in this role."}"
    
    I found a potential lead:
    Name: ${leadData.name}
    URL: ${leadData.url}
    
    Context/Bio (What they do): 
    "${leadData.notes}"

    Observed Pain Points (Why I think they need help): 
    "${leadData.painPoints}"

    Task:
    Analyze if this lead is a good fit **specifically for ME based on MY RESUME/BIO**. 
    
    1. Match my specific hard skills (from my bio) to their problems.
    2. If my bio says I am a "Junior", avoid "Enterprise" clients. If I am "Expert", avoid "Low budget" look.
    3. Does my unique positioning solve their "Observed Pain Points"? 
    
    Be critical. 
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Compatibility score 0-100" },
      reasoning: { type: Type.STRING, description: "Why this score? explicitly connect User's Bio Skills to Lead's Pain Points." },
      pros: { type: Type.ARRAY, items: { type: Type.STRING } },
      cons: { type: Type.ARRAY, items: { type: Type.STRING } },
      verdict: { type: Type.STRING, enum: ["Recommended", "Caution", "Avoid"] }
    },
    required: ["score", "reasoning", "pros", "cons", "verdict"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text) as LeadAnalysis;
    }
    throw new Error("No analysis generated");
  } catch (error) {
    console.error("Error analyzing lead:", error);
    throw error;
  }
};

/**
 * Step 5: Generate Outreach Material
 */
export const generateOutreachDraft = async (
  leadData: { name: string; notes: string; painPoints: string },
  userProfile: UserProfile & { bio?: string },
  analysis: LeadAnalysis,
  tone: OutreachTone,   
  length: OutreachLength 
): Promise<OutreachDraft> => {
  const ai = getAiClient();

  const prompt = `
    You are an expert sales copywriter.
    
    Sender: A "${userProfile.jobTitle}" in niche "${userProfile.targetNiche}".
    Sender Context (My Bio/Resume): "${userProfile.bio || ''}".

    Recipient (Lead): "${leadData.name}". 
    Recipient Bio: "${leadData.notes}".
    Identified Problem/Pain Point: "${leadData.painPoints}".
    Target Platform: "${userProfile.targetPlatform}".
    
    Analysis Context: Verdict "${analysis.verdict}", Reason "${analysis.reasoning}".

    USER PREFERENCES:
    - Tone: "${tone}" (Casual = friendly/slang/emoji allowed if fit, Professional = strict/formal).
    - Length: "${length}" (Short = <50 words/Direct to point, Long = Detailed/Cold Email structure).

    Task:
    1. Create a personalized DM/Email script based on the Tone and Length preference.
    2. Leverage my specific skills (from Sender Context) to solve their problem.
    3. The Hook must address the "${leadData.painPoints}" immediately.
    
    Task 2: PREPARATION STEPS (CRITICAL):
    Analyze the Sender's Context.
    - If the Sender seems to be a BEGINNER or lacks a strong PORTFOLIO in their Bio:
      Suggest "Value-First" actions to prove competence BEFORE pitching. 
      Examples: "Create a free mockup of their landing page", "Record a 2-min video auditing their current Instagram", "Write a sample blog post for them".
    - If the Sender is an EXPERT:
      Suggest "Authority" actions. Examples: "Link to a similar case study", "Mention a shared connection".
    
    Generate 3-5 specific, actionable steps the user should do BEFORE hitting send to increase response rate.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING, description: "Email subject line (empty string if not needed for platform/style)" },
      messageBody: { type: Type.STRING, description: "The actual message content formatted for the platform" },
      visualSuggestions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Ideas for images/videos to attach" },
      preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific actions to take before sending (e.g. Create Mockup, Audit Site)" }
    },
    required: ["messageBody", "visualSuggestions", "preparationSteps"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text) as OutreachDraft;
    }
    throw new Error("No outreach generated");
  } catch (error) {
    console.error("Error generating outreach:", error);
    throw error;
  }
};

/**
 * Step 6: Refine Outreach (Rewriting)
 */
export const refineOutreachDraft = async (
  currentDraft: OutreachDraft,
  instruction: string
): Promise<OutreachDraft> => {
  const ai = getAiClient();

  const prompt = `
    Current Message Body:
    "${currentDraft.messageBody}"

    Current Subject:
    "${currentDraft.subject || ''}"

    User Instruction for Revision:
    "${instruction}"

    Task:
    Rewrite the message body (and subject if applicable) according to the user's specific instruction.
    Keep the Visual Suggestions and Preparation Steps generally the same unless the instruction implies changing them.
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      subject: { type: Type.STRING },
      messageBody: { type: Type.STRING, description: "The rewritten message" },
      visualSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
      preparationSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
    },
    required: ["messageBody", "visualSuggestions", "preparationSteps"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text) as OutreachDraft;
    }
    throw new Error("No refined outreach generated");
  } catch (error) {
    console.error("Error refining outreach:", error);
    throw error;
  }
};

/**
 * AI Connection Tester
 */
export const checkAiConnection = async (): Promise<boolean> => {
  try {
    const ai = getAiClient();
    // A fast, token-cheap ping
    await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "ping",
      config: { maxOutputTokens: 1 }
    }));
    return true;
  } catch (error: any) {
    const errMsg = error?.message || '';
    // A 429 Quota / Rate Limit error means the connection IS successfully reaching Google
    // and the API key is 100% valid. So the system IS connected, just out of quota.
    if (errMsg.includes('429') || errMsg.includes('Quota')) {
      console.warn("AI Connection established, but currently Rate Limited (429).");
      return true;
    }
    console.warn("AI Connection Failed:", error);
    return false;
  }
};

/**
 * CV Pattern Match Analyzer
 */
export const analyzeCvMatch = async (cvText: string, jobText: string): Promise<CvAnalysisResult> => {
  const ai = getAiClient();

  const prompt = `
    Act as a strict, senior Technical Recruiter.
    I will provide you with two pieces of text:
    1. A Candidate's CV/Resume text.
    2. A Job Description.

    CANDIDATE CV:
    """
    ${cvText}
    """

    JOB DESCRIPTION:
    """
    ${jobText}
    """

    Task:
    Analyze how well the Candidate fits the Job Description.

    Provide:
    1. A matchScore from 0 to 100 based on hard skills and required experience.
    2. Detailed, recruiter-level reasoning for the score.
    3. A list of matching skills mentioned in both (or synonymous).
    4. A list of missing skills that are in the job description but NOT explicitly stated in the CV.
    5. Actionable improvement tips (e.g. how they should edit their CV to show the missing skills better, or if they just shouldn't apply).
  `;

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      matchScore: { type: Type.INTEGER, description: "Match score percentage (0-100)" },
      reasoning: { type: Type.STRING, description: "Recruiter's logic for the score" },
      matchingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of found skills" },
      missingSkills: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of critically missing skills" },
      recommendation: { type: Type.STRING, enum: ["Highly Recommended", "Good Fit", "Apply with Caution", "Not a Fit"] },
      improvementTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "What to change on the CV before applying" }
    },
    required: ["matchScore", "reasoning", "matchingSkills", "missingSkills", "recommendation", "improvementTips"]
  };

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    }));

    if (response.text) {
      return JSON.parse(response.text) as CvAnalysisResult;
    }
    throw new Error("No CV analysis generated");
  } catch (error) {
    console.error("Error matching CV:", error);
    throw error;
  }
};

/**
 * AI CV Restructurer: Reorganizes the CV for better impact.
 */
export const restructureCv = async (cvText: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Analyze the following CV content.
    
    Task:
    Restructure and rewrite this CV to have a more logical and impactful flow.
    Reorganize the sections (e.g., Professional Summary, Core Skills, Experience, Projects) to ensure the strongest information is presented first.
    Use professional language and maintain all original information but optimize the phrasing for maximum impact.
    
    Format:
    Plain text only. Use clear section headers in ALL CAPS. 
    Do not use markdown formatting (like # or **).
    
    CV CONTENT:
    """
    ${cvText}
    """
  `;

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    }));
    return response.text ? response.text.trim() : "";
  } catch (error) {
    console.error("Error restructuring CV:", error);
    throw error;
  }
};

/**
 * AI Resume Tailor: Rewrites the CV to match a specific job description.
 */
export const tailorResumeToJob = async (cvText: string, jobText: string): Promise<string> => {
  const ai = getAiClient();
  const prompt = `
    Act as a professional resume writer for top-tier tech companies.
    
    CANDIDATE CV:
    """
    ${cvText}
    """
    
    JOB DESCRIPTION:
    """
    ${jobText}
    """
    
    Task:
    Create a highly tailored version of the candidate's Resume specifically for THIS Job Description.
    1. Align keywords from the JOB DESCRIPTION into the Resume.
    2. Highlight experience that is most relevant to the Job Description's requirements.
    3. Rewrite the Professional Summary to directly address how the candidate solves the company's specific needs.
    4. Maintain honesty; reflect the candidate's existing experience but use the job's terminology.
    
    Format:
    Plain text only. Use clear section headers in ALL CAPS.
    Do not use markdown formatting (like # or **).
    
    OUTPUT:
    Tailored Resume version.
  `;

  try {
    const response = await runWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    }));
    return response.text ? response.text.trim() : "";
  } catch (error) {
    console.error("Error tailoring resume:", error);
    throw error;
  }
};

