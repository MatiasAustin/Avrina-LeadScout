
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
}

export interface Testimonial {
  id: string;
  userId: string;
  userName: string;
  userRole: string; // e.g. "Web Developer"
  content: string;
  date: string;
}