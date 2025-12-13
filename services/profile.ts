import { supabase, isSupabaseConfigured } from "./supabase";

export const updateUserProfile = async (
  userId: string, 
  data: { jobTitle: string; niche: string; bio: string; name?: string }
) => {
  
  // 1. Guest Mode / Offline Mode
  if (!isSupabaseConfigured || userId === 'guest' || userId === 'local-admin') {
    localStorage.setItem('ls_job', data.jobTitle);
    localStorage.setItem('ls_niche', data.niche);
    localStorage.setItem('ls_bio', data.bio);
    if (data.name) localStorage.setItem('ls_name', data.name); // Optional name storage for guest
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    return;
  }

  // 2. Supabase Mode
  const updates = {
    job_title: data.jobTitle,
    target_niche: data.niche,
    bio: data.bio,
    updated_at: new Date().toISOString(),
    ...(data.name && { full_name: data.name })
  };

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);

  if (error) throw error;
};