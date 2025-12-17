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
  // Note: We removed 'updated_at' from the payload to prevent "column not found" errors
  // if the database table wasn't set up with that specific column.
  const updates = {
    id: userId, // Required for upsert to work
    job_title: data.jobTitle,
    target_niche: data.niche,
    bio: data.bio,
    ...(data.name && { full_name: data.name })
  };

  // Changed from update() to upsert()
  // This ensures that if the profile row doesn't exist yet, it gets created.
  const { error } = await supabase
    .from('profiles')
    .upsert(updates);

  if (error) throw error;
};