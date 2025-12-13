import { supabase, isSupabaseConfigured } from "./supabase";
import { User, UserRole, AppConfig } from "../types";

// --- HELPERS ---

const mapSupabaseUser = async (sbUser: any): Promise<User> => {
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
      jobTitle: profile?.job_title || '',
      niche: profile?.target_niche || '',
      bio: profile?.bio || ''
    };
  } catch (e) {
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
  
  // If email confirmation is on, data.user is returned but session is null usually.
  // We throw a specific error to UI to tell them to check email.
  if (data.user && !data.session) {
    throw new Error("Confirmation email sent. Please check your inbox.");
  }

  if (!data.user) throw new Error("Registration failed");

  return mapSupabaseUser(data.user);
};

export const login = async (email: string, password: string): Promise<User> => {
  if (!isSupabaseConfigured) {
    if (email === 'admin@avrina.com' && password === 'Aois83bi%^6as') {
       return createLocalAdmin();
    }
    throw new Error("Backend not connected. Use 'admin@avrina.com' to test Admin Panel locally.");
  }

  // 1. ATTEMPT REAL SUPABASE LOGIN FIRST
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (!error && data.user) {
    return mapSupabaseUser(data.user);
  }

  // 2. FALLBACK: LOCAL ADMIN BACKDOOR
  if (email === 'admin@avrina.com' && password === 'Aois83bi%^6as') {
     console.warn("Logged in via Backdoor due to Supabase auth failure.");
     return createLocalAdmin();
  }

  if (error) throw error;
  throw new Error("Login failed");
};

export const resendConfirmation = async (email: string) => {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });
  if (error) throw error;
};

const createLocalAdmin = (): User => {
  sessionStorage.setItem('avrina_local_admin', 'true');
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
};

export const loginAsGuest = (): User => {
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
  if (sessionStorage.getItem('avrina_guest_active')) {
    return loginAsGuest();
  }
  if (sessionStorage.getItem('avrina_local_admin')) {
    return createLocalAdmin();
  }
  if (!isSupabaseConfigured) {
    return null;
  }
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
  // 1. Try Local Storage First (Fastest & Fallback)
  const local = localStorage.getItem('avrina_local_config');
  let localConfig = local ? JSON.parse(local) : null;

  if (!isSupabaseConfigured) {
    return { ...DEFAULT_CONFIG, ...localConfig };
  }

  try {
    // 2. Try Supabase
    const { data, error } = await supabase
      .from('app_config')
      .select('*')
      .order('id', { ascending: true }) 
      .limit(1)
      .single();

    if (error || !data) {
      // If DB fails or is empty, use LocalStorage if available
      if (localConfig) return { ...DEFAULT_CONFIG, ...localConfig };
      return DEFAULT_CONFIG;
    }
    
    // DB Success
    return { 
      donationLink: data.donation_link || '',
      announcementText: data.announcement_text || '',
      adminWhatsapp: data.admin_whatsapp || '',
      adminInstagram: data.admin_instagram || '',
      adminLinkedin: data.admin_linkedin || '',
      dedicationMessage: data.dedication_message || '',
      signature: data.signature || '',
      appName: data.app_name || '',
      appLogo: data.app_logo || ''
    };
  } catch (e) {
    // Fallback to local on crash
    if (localConfig) return { ...DEFAULT_CONFIG, ...localConfig };
    return DEFAULT_CONFIG;
  }
};

export const saveConfig = async (config: AppConfig) => {
  // 1. ALWAYS Save to LocalStorage first (Backup/Optimistic)
  localStorage.setItem('avrina_local_config', JSON.stringify(config));

  if (!isSupabaseConfigured) return;

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

  try {
    // 2. Try Supabase Write
    const { data: existingData, error: fetchError } = await supabase
      .from('app_config')
      .select('id')
      .limit(1);
      
    if (fetchError) throw fetchError;

    if (existingData && existingData.length > 0) {
      const { error } = await supabase
        .from('app_config')
        .update(dbConfig)
        .eq('id', existingData[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('app_config')
        .insert(dbConfig);
      if (error) throw error;
    }
  } catch (err: any) {
    console.error("DB Save Failed:", err);
    throw new Error(`Database write failed (${err.message || 'Check RLS policies'}). Data saved LOCALLY only.`);
  }
};

// --- ADMIN FUNCTIONS ---

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;

  return data.map((p: any) => ({
    id: p.id,
    email: p.email,
    name: p.full_name,
    role: p.role,
    createdAt: p.created_at,
    jobTitle: p.job_title,
    niche: p.target_niche
  }));
};

export const sendPasswordReset = async (email: string) => {
  if (!isSupabaseConfigured) throw new Error("Service not available offline.");
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
};