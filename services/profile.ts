import { supabase, isSupabaseConfigured } from "./supabase";

export const updateUserProfile = async (
  userId: string, 
  data: { 
    jobTitle: string; 
    niche: string; 
    bio: string; 
    name?: string;
    dailyTarget?: number;
    weeklyTarget?: number;
    monthlyTarget?: number;
  }
) => {
  
  // 1. Guest Mode / Offline Mode
  if (!isSupabaseConfigured || userId === 'guest' || userId === 'local-admin') {
    localStorage.setItem('ls_job', data.jobTitle);
    localStorage.setItem('ls_niche', data.niche);
    localStorage.setItem('ls_bio', data.bio);
    if (data.name) localStorage.setItem('ls_name', data.name);
    
    // Save Targets to localStorage
    if (data.dailyTarget) localStorage.setItem('ls_target_daily', data.dailyTarget.toString());
    if (data.weeklyTarget) localStorage.setItem('ls_target_weekly', data.weeklyTarget.toString());
    if (data.monthlyTarget) localStorage.setItem('ls_target_monthly', data.monthlyTarget.toString());
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  // 2. Supabase Mode
  const updates = {
    id: userId,
    job_title: data.jobTitle,
    target_niche: data.niche,
    bio: data.bio,
    daily_target: data.dailyTarget,
    weekly_target: data.weeklyTarget,
    monthly_target: data.monthlyTarget,
    ...(data.name && { full_name: data.name })
  };

  // Changed from update() to upsert()
  // This ensures that if the profile row doesn't exist yet, it gets created.
  const { error } = await supabase
    .from('profiles')
    .upsert(updates);

  if (error) throw error;
};