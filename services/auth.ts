import { supabase, isSupabaseConfigured } from "./supabase";
import { User, UserRole, AppConfig } from "../types";

// --- HELPERS ---

const mapSupabaseUser = async (sbUser: any): Promise<User> => {
  // If not configured, return basic info from metadata (fallback)
  if (!isSupabaseConfigured) {
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: sbUser.user_metadata?.full_name || 'User',
      role: 'user',
      createdAt: sbUser.created_at,
      jobTitle: '',
      niche: '',
      bio: ''
    };
  }

  // Fetch profile to get Role, Name, and Professional Details from DB
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .single();

    return {
      id: sbUser.id,
      email: sbUser.email,
      name: profile?.full_name || sbUser.user_metadata?.full_name || 'User',
      role: (profile?.role as UserRole) || 'user',
      createdAt: sbUser.created_at,
      // Map new fields (handling snake_case from DB)
      jobTitle: profile?.job_title || '',
      niche: profile?.target_niche || '',
      bio: profile?.bio || ''
    };
  } catch (e) {
    // Fallback if profile fetch fails
    return {
      id: sbUser.id,
      email: sbUser.email,
      name: sbUser.user_metadata?.full_name || 'User',
      role: 'user',
      createdAt: sbUser.created_at,
      jobTitle: '',
      niche: '',
      bio: ''
    };
  }
};

// --- AUTH LOGIC ---

export const register = async (name: string, email: string, password: string): Promise<User> => {
  if (!isSupabaseConfigured) {
    throw new Error("Backend not connected. Please use 'Continue as Guest' for the demo.");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name }
    }
  });

  if (error) throw error;
  if (!data.user) throw new Error("Registration failed");

  return mapSupabaseUser(data.user);
};

export const login = async (email: string, password: string): Promise<User> => {
  // 1. LOCAL ADMIN BACKDOOR (For testing without DB)
  if (email === 'admin@avrina.com' && password === 'Aois83bi%^6as') {
     const adminUser: User = {
       id: 'local-admin',
       email: 'admin@avrina.com',
       name: 'Local Admin',
       role: 'admin',
       createdAt: new Date().toISOString(),
       jobTitle: 'Administrator',
       niche: 'SaaS',
       bio: 'System Admin'
     };
     sessionStorage.setItem('avrina_local_admin', 'true');
     return adminUser;
  }

  if (!isSupabaseConfigured) {
    throw new Error("Backend not connected. Use 'admin@avrina.com' to test Admin Panel locally.");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  if (!data.user) throw new Error("Login failed");

  return mapSupabaseUser(data.user);
};

export const loginAsGuest = (): User => {
  // Try to load guest profile from localstorage
  const savedJob = localStorage.getItem('ls_job') || '';
  const savedNiche = localStorage.getItem('ls_niche') || '';
  const savedBio = localStorage.getItem('ls_bio') || '';

  const guest: User = {
    id: 'guest',
    email: 'guest@temp.com',
    name: 'Guest User',
    role: 'guest',
    createdAt: new Date().toISOString(),
    jobTitle: savedJob,
    niche: savedNiche,
    bio: savedBio
  };
  // Store guest flag in session storage so we know to use local logic
  sessionStorage.setItem('avrina_guest_active', 'true');
  return guest;
};

export const logout = async () => {
  sessionStorage.removeItem('avrina_guest_active');
  sessionStorage.removeItem('avrina_local_admin');
  if (isSupabaseConfigured) {
    await supabase.auth.signOut();
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Check Guest First
  if (sessionStorage.getItem('avrina_guest_active')) {
    return loginAsGuest();
  }

  // Check Local Admin
  if (sessionStorage.getItem('avrina_local_admin')) {
    return {
       id: 'local-admin',
       email: 'admin@avrina.com',
       name: 'Local Admin',
       role: 'admin',
       createdAt: new Date().toISOString(),
       jobTitle: 'Administrator',
       niche: 'SaaS',
       bio: 'System Admin'
     };
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  // Check Supabase Session
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      return mapSupabaseUser(data.session.user);
    }
  } catch (e) {
    console.warn("Auth check error:", e);
  }
  return null;
};

// --- CONFIG / DONATION ---

const DEFAULT_CONFIG: AppConfig = { 
  donationLink: 'https://saweria.co/avrina',
  announcementText: "🚀 Open for partnerships & custom collaborations! Let's connect.",
  adminWhatsapp: '',
  adminInstagram: '',
  adminLinkedin: '',
  dedicationMessage: "Teruntuk kamu. Bukti kecil bahwa kerja tak selalu tentang seragam, dan masa depan cerah bisa dibangun dari mana saja.",
  signature: "Matias Austin",
  appName: "Avrina LeadScout",
  appLogo: ""
};

export const getConfig = async (): Promise<AppConfig> => {
  if (!isSupabaseConfigured) {
    // Fallback for guest or unconfigured state
    const local = localStorage.getItem('avrina_local_config');
    if (local) return { ...DEFAULT_CONFIG, ...JSON.parse(local) };
    return DEFAULT_CONFIG;
  }

  try {
    const { data, error } = await supabase
      .from('app_config')
      .select('*') // Select all columns now
      .limit(1)
      .single();

    if (error || !data) {
      return DEFAULT_CONFIG;
    }
    
    return { 
      donationLink: data.donation_link || DEFAULT_CONFIG.donationLink,
      announcementText: data.announcement_text || DEFAULT_CONFIG.announcementText,
      adminWhatsapp: data.admin_whatsapp || '',
      adminInstagram: data.admin_instagram || '',
      adminLinkedin: data.admin_linkedin || '',
      dedicationMessage: data.dedication_message || DEFAULT_CONFIG.dedicationMessage,
      signature: data.signature || DEFAULT_CONFIG.signature,
      appName: data.app_name || DEFAULT_CONFIG.appName,
      appLogo: data.app_logo || DEFAULT_CONFIG.appLogo
    };
  } catch (e) {
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: AppConfig) => {
  if (!isSupabaseConfigured) {
     // Save locally if offline/local admin
     localStorage.setItem('avrina_local_config', JSON.stringify(config));
     return;
  }

  // Map to snake_case for DB
  const dbConfig = {
    donation_link: config.donationLink,
    announcement_text: config.announcementText,
    admin_whatsapp: config.adminWhatsapp,
    admin_instagram: config.adminInstagram,
    admin_linkedin: config.adminLinkedin,
    dedication_message: config.dedicationMessage,
    signature: config.signature,
    app_name: config.appName,
    app_logo: config.appLogo
  };

  const { error } = await supabase
    .from('app_config')
    .update(dbConfig)
    .gt('id', 0); 

  if (error) throw error;
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) {
    // Return dummy data so admin dashboard isn't empty in local mode
    return [
      { id: 'local-admin', email: 'admin@avrina.com', name: 'Local Admin', role: 'admin', createdAt: new Date().toISOString() },
      { id: 'guest', email: 'guest@temp.com', name: 'Guest User', role: 'guest', createdAt: new Date().toISOString() }
    ];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*');
    
  if (error) throw error;

  return data.map((p: any) => ({
    id: p.id,
    email: p.email,
    name: p.full_name,
    role: p.role,
    createdAt: p.created_at
  }));
};

export const sendPasswordReset = async (email: string) => {
  if (!isSupabaseConfigured) throw new Error("Service not available offline.");
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};