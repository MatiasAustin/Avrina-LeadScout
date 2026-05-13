
export enum Platform {
  Google = 'Google',
  GoogleMaps = 'Google Maps',
  TikTok = 'TikTok',
  LinkedIn = 'LinkedIn',
  Instagram = 'Instagram',
  Twitter = 'Twitter/X',
  YouTube = 'YouTube'
}

export enum LeadStatus {
  NEW = 'To Do',         // Baru masuk database
  QUALIFIED = 'Qualified', // AI bilang cocok
  CONTACTED = 'Contacted', // DM Sent
  NEGOTIATING = 'Negotiating', // Balas-balasan
  WON = 'Client',        // Deal
  LOST = 'Lost'          // Ditolak/Ghosting
}

export type Theme = 'light' | 'dark' | 'pink';
export type Language = 'en' | 'id';

export type OutreachTone = 'Casual' | 'Semi-Formal' | 'Professional';
export type OutreachLength = 'Short' | 'Medium' | 'Long';

export interface PositioningSuggestion {
  type: string; // e.g. "The Authority", "The Problem Solver"
  statement: string;
  explanation: string;
}

export interface SearchStrategy {
  nicheSuggestions: string[];
  keywords: string[];
  tips: string[];
}

export interface LeadAnalysis {
  score: number; // 0-100
  reasoning: string;
  pros: string[];
  cons: string[];
  verdict: 'Recommended' | 'Caution' | 'Avoid';
}

export interface OutreachDraft {
  subject?: string;
  messageBody: string;
  visualSuggestions: string[];
  preparationSteps: string[];
}

export interface Lead {
  id: string;
  name: string; // Company or Person Name
  url: string;
  platform: Platform;
  niche: string; // The niche this lead belongs to
  dateAdded: string; // ISO string
  status: LeadStatus;
  notes: string; // User manually pasted bio or details
  painPoints: string; // New field: Specific problems observed by user
  
  // NEW Revenue Tracking
  value?: number;
  currency?: string;
  dealType?: 'project' | 'retainer';

  // AI Generated Data
  analysis?: LeadAnalysis;
  outreach?: OutreachDraft;
}

export interface UserProfile {
  jobTitle: string;
  targetPlatform: Platform;
  targetNiche: string;
}

// --- NEW AUTH TYPES ---

export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string;
  email: string;
  password?: string; // Stored in plain text for this demo (In real app, hash this!)
  name: string;
  role: UserRole;
  createdAt: string;
  
  // New Profile Fields
  jobTitle?: string;
  niche?: string;
  bio?: string;

  // NEW Productivity Targets
  dailyTarget?: number;
  weeklyTarget?: number;
  monthlyTarget?: number;
}

export interface AppConfig {
  donationLink: string;
  announcementText?: string;
  adminWhatsapp?: string;
  adminInstagram?: string;
  adminLinkedin?: string;
  // New personalization fields
  dedicationMessage?: string;
  signature?: string;
  // Branding
  appName?: string;
  appLogo?: string; // URL

  // NEW AI & DB CONFIG
  aiApiKey?: string;
  aiProvider?: 'google' | 'openai';
  dbUrl?: string;
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userRole: string; // e.g. "Web Developer"
  content: string;
  date: string;
}

// --- NEW BLOG TYPES ---
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  imageUrl?: string;
  authorId?: string;
  status: 'draft' | 'published';
  createdAt: string;
  updatedAt: string;
}

// --- NEW STATS TYPES ---
export interface VisitorStat {
  id: string;
  pagePath: string;
  userAgent: string;
  referrer?: string;
  ipAddress?: string;
  timestamp: string;
}

// --- NEW CV MATCHER TYPES ---
export interface CvAnalysisResult {
  matchScore: number;
  reasoning: string;
  matchingSkills: string[];
  missingSkills: string[];
  recommendation: 'Highly Recommended' | 'Good Fit' | 'Apply with Caution' | 'Not a Fit';
  improvementTips: string[];
}