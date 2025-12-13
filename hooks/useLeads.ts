import { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { getCurrentUser } from '../services/auth';
import { supabase, isSupabaseConfigured } from '../services/supabase';

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initial Load
  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setLoading(true);
    const user = await getCurrentUser();
    
    // Determine mode
    // GUEST = LocalStorage
    // LOGGED IN (User/Admin) = Supabase Only
    const isGuest = user?.role === 'guest' || user?.id === 'local-admin' || !isSupabaseConfigured;
    setIsLocalMode(isGuest);

    if (isGuest) {
      // Guest mode: Use Local Storage
      const saved = localStorage.getItem('leadscout_leads_guest');
      if (saved) {
        setLeads(JSON.parse(saved));
      } else {
        setLeads([]); // No dummy data, clean slate
      }
    } else if (user) {
      // DB mode: Fetch from Supabase
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        const mappedLeads: Lead[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          url: d.url,
          platform: d.platform,
          niche: d.niche,
          dateAdded: d.created_at,
          status: d.status,
          notes: d.notes,
          painPoints: d.pain_points,
          analysis: d.analysis,
          outreach: d.outreach
        }));
        setLeads(mappedLeads);
      } else {
        setLeads([]); // Return empty if error or no data
      }
    }
    setLoading(false);
  };

  // --- CRUD ACTIONS ---

  const addLead = async (lead: Lead) => {
    if (isLocalMode) {
      const newLeads = [lead, ...leads];
      setLeads(newLeads);
      localStorage.setItem('leadscout_leads_guest', JSON.stringify(newLeads));
    } else {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: user.data.user.id,
          name: lead.name,
          url: lead.url,
          platform: lead.platform,
          niche: lead.niche,
          status: lead.status,
          notes: lead.notes,
          pain_points: lead.painPoints,
          analysis: lead.analysis,
          outreach: lead.outreach
        })
        .select()
        .single();

      if (!error && data) {
         setLeads(prev => [{ ...lead, id: data.id }, ...prev]);
      } else {
        console.error("Supabase insert error:", error);
      }
    }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    // Optimistic Update
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));

    if (isLocalMode) {
      const currentLeads = JSON.parse(localStorage.getItem('leadscout_leads_guest') || '[]');
      const updated = currentLeads.map((l: Lead) => l.id === id ? { ...l, ...updates } : l);
      localStorage.setItem('leadscout_leads_guest', JSON.stringify(updated));
    } else {
      const dbUpdates: any = {};
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.analysis) dbUpdates.analysis = updates.analysis;
      if (updates.outreach) dbUpdates.outreach = updates.outreach;
      if (updates.notes) dbUpdates.notes = updates.notes;
      if (updates.painPoints) dbUpdates.pain_points = updates.painPoints;

      const { error } = await supabase
        .from('leads')
        .update(dbUpdates)
        .eq('id', id);
        
      if (error) console.error("Update failed", error);
    }
  };

  const deleteLead = async (id: string) => {
    // Optimistic Update
    setLeads(prev => prev.filter(l => l.id !== id));

    if (isLocalMode) {
      const currentLeads = JSON.parse(localStorage.getItem('leadscout_leads_guest') || '[]');
      const filtered = currentLeads.filter((l: Lead) => l.id !== id);
      localStorage.setItem('leadscout_leads_guest', JSON.stringify(filtered));
    } else {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) console.error("Delete failed", error);
    }
  };

  const getStats = () => {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);
    
    const closed = (byStatus[LeadStatus.WON] || 0) + (byStatus[LeadStatus.LOST] || 0);
    const winRate = closed > 0 ? Math.round(((byStatus[LeadStatus.WON] || 0) / closed) * 100) : 0;

    return { total, byStatus, winRate };
  };

  return { leads, addLead, updateLead, deleteLead, getStats, loading };
};