import { useState, useEffect, useRef } from 'react';
import { Lead, LeadStatus } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';

const mapRow = (d: any): Lead => ({
  id: d.id,
  name: d.name,
  url: d.url,
  socialMediaUrl: d.social_media_url,
  platform: d.platform,
  niche: d.niche,
  targetEmail: d.target_email,
  value: d.value,
  currency: d.currency,
  dealType: d.deal_type,
  dateAdded: d.created_at,
  status: d.status,
  notes: d.notes,
  painPoints: d.pain_points,
  analysis: d.analysis,
  outreach: d.outreach,
  outreachChannel: d.outreach_channel ? (typeof d.outreach_channel === 'string' ? d.outreach_channel.split(',').map((s: string) => s.trim()).filter(Boolean) : Array.isArray(d.outreach_channel) ? d.outreach_channel : [d.outreach_channel]) : [],
});

export const useLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const realtimeChannelRef = useRef<any>(null);

  useEffect(() => {
    loadLeads();
    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  const loadLeads = async () => {
    setLoading(true);

    // --- SUMBER KEBENARAN: cek session Supabase secara langsung ---
    // Ini TIDAK bergantung pada getCurrentUser() yang bisa return 'local-admin' (fallback lokal)
    let isSupabaseLoggedIn = false;
    let supabaseUserId: string | null = null;
    let supabaseUserRole: string = 'user';

    if (isSupabaseConfigured) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          isSupabaseLoggedIn = true;
          supabaseUserId = sessionData.session.user.id;
          // Ambil role dari tabel profiles untuk cek admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', supabaseUserId)
            .single();
          supabaseUserRole = profile?.role || 'user';
        }
      } catch (e) {
        console.warn('Session check failed:', e);
      }
    }

    // Gunakan Supabase HANYA kalau benar-benar login via Supabase
    const isGuest = !isSupabaseLoggedIn;
    setIsLocalMode(isGuest);

    if (isGuest) {
      // === GUEST / LOCAL MODE: pakai localStorage ===
      const saved = localStorage.getItem('leadscout_leads_guest');
      setLeads(saved ? JSON.parse(saved) : []);
      setLoading(false);
      return;
    }

    // === SUPABASE MODE: ambil dari database ===
    // Admin lihat SEMUA leads. User biasa lihat leads milik sendiri.
    const isAdmin = supabaseUserRole === 'admin';
    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });

    if (!isAdmin && supabaseUserId) {
      // User biasa: filter hanya leads milik diri sendiri
      query = query.eq('user_id', supabaseUserId);
    }
    // Admin: tidak perlu filter user_id, bisa lihat semua

    const { data, error } = await query;

    if (!error && data) {
      setLeads(data.map(mapRow));
    } else {
      console.error('Supabase fetch error:', error);
      setLeads([]);
    }

    // === REALTIME SUBSCRIPTION: sync antar device ===
    // Hapus channel lama dulu kalau ada
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLead = mapRow(payload.new);
            // Kalau user biasa, hanya tampilkan leads miliknya
            if (!isAdmin && payload.new.user_id !== supabaseUserId) return;
            setLeads(prev => {
              // Hindari duplikat
              if (prev.some(l => l.id === newLead.id)) return prev;
              return [newLead, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev => prev.map(l => l.id === payload.new.id ? mapRow(payload.new) : l));
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;
    setLoading(false);
  };

  // --- CRUD ACTIONS ---

  const addLead = async (lead: Lead) => {
    if (isLocalMode) {
      const newLeads = [lead, ...leads];
      setLeads(newLeads);
      localStorage.setItem('leadscout_leads_guest', JSON.stringify(newLeads));
    } else {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('leads')
        .insert({
          user_id: userData.user.id,
          name: lead.name,
          url: lead.url,
          social_media_url: lead.socialMediaUrl,
          platform: lead.platform,
          niche: lead.niche,
          target_email: lead.targetEmail,
          value: lead.value,
          currency: lead.currency,
          deal_type: lead.dealType,
          status: lead.status,
          notes: lead.notes,
          pain_points: lead.painPoints,
          analysis: lead.analysis,
          outreach: lead.outreach,
          outreach_channel: lead.outreachChannel ? lead.outreachChannel.join(',') : null,
        })
        .select()
        .single();

      if (!error && data) {
        // Optimistic: tambah ke state langsung (realtime akan handle sync antar device)
        setLeads(prev => {
          if (prev.some(l => l.id === data.id)) return prev;
          return [{ ...lead, id: data.id, dateAdded: data.created_at }, ...prev];
        });
      } else {
        console.error('Supabase insert error:', error);
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
      if (updates.status !== undefined)    dbUpdates.status = updates.status;
      if (updates.analysis !== undefined)  dbUpdates.analysis = updates.analysis;
      if (updates.outreach !== undefined)  dbUpdates.outreach = updates.outreach;
      if (updates.notes !== undefined)     dbUpdates.notes = updates.notes;
      if (updates.painPoints !== undefined) dbUpdates.pain_points = updates.painPoints;
      if (updates.name !== undefined)      dbUpdates.name = updates.name;
      if (updates.url !== undefined)       dbUpdates.url = updates.url;
      if (updates.socialMediaUrl !== undefined) dbUpdates.social_media_url = updates.socialMediaUrl;
      if (updates.platform !== undefined)  dbUpdates.platform = updates.platform;
      if (updates.niche !== undefined)     dbUpdates.niche = updates.niche;
      if (updates.targetEmail !== undefined) dbUpdates.target_email = updates.targetEmail;
      if (updates.value !== undefined)     dbUpdates.value = updates.value;
      if (updates.currency !== undefined)  dbUpdates.currency = updates.currency;
      if (updates.dealType !== undefined)  dbUpdates.deal_type = updates.dealType;
      if (updates.outreachChannel !== undefined) dbUpdates.outreach_channel = updates.outreachChannel.join(',');

      const { error } = await supabase.from('leads').update(dbUpdates).eq('id', id);
      if (error) console.error('Update failed:', error);
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
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) console.error('Delete failed:', error);
    }
  };

  const getStats = (timeRange: 'all' | 'day' | 'week' | 'month' = 'all') => {
    let filteredLeads = leads;

    if (timeRange !== 'all') {
      const now = new Date();
      filteredLeads = leads.filter(lead => {
        const leadDate = new Date(lead.dateAdded);
        const diffTime = Math.abs(now.getTime() - leadDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (timeRange === 'day') return diffDays <= 1;
        if (timeRange === 'week') return diffDays <= 7;
        if (timeRange === 'month') return diffDays <= 30;
        return true;
      });
    }

    const total = filteredLeads.length;
    const byStatus = filteredLeads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);

    const closed = (byStatus[LeadStatus.WON] || 0) + (byStatus[LeadStatus.LOST] || 0);
    const winRate = closed > 0 ? Math.round(((byStatus[LeadStatus.WON] || 0) / closed) * 100) : 0;

    const repliedCount = (byStatus[LeadStatus.REPLIED] || 0) + 
                         (byStatus[LeadStatus.NEGOTIATING] || 0) + 
                         (byStatus[LeadStatus.WON] || 0);
    const replyRate = total > 0 ? Math.round((repliedCount / total) * 100) : 0;

    return { total, byStatus, winRate, replyRate };
  };

  return { leads, addLead, updateLead, deleteLead, getStats, loading };
};