import { supabase, isSupabaseConfigured } from "./supabase";
import { VisitorStat, VisitorSummary } from "../types";

export const trackVisitor = async (pagePath: string) => {
  if (!isSupabaseConfigured) return;

  try {
    const { error } = await supabase.from('visitor_stats').insert({
      page_path: pagePath,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });
    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation "visitor_stats" does not exist')) {
        console.warn("Visitor Stats table not found. Please run schema_update.sql in Supabase.");
      } else {
        console.error("Track Error:", error);
      }
    }
  } catch (e) {
    console.error("Tracking failed:", e);
  }
};

export const getVisitorStats = async () => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('visitor_stats')
    .select('*')
    .order('timestamp', { ascending: false });

  if (error) throw error;

  return data.map((s: any) => ({
    id: s.id,
    pagePath: s.page_path,
    userAgent: s.user_agent,
    referrer: s.referrer,
    timestamp: s.timestamp
  })) as VisitorStat[];
};

export const getVisitorSummary = async (): Promise<VisitorSummary> => {
  if (!isSupabaseConfigured) return { total: 0, byPage: {} };

  const { data, error } = await supabase
    .from('visitor_stats')
    .select('page_path');

  if (error) throw error;

  const summary = data.reduce((acc: VisitorSummary, curr: any) => {
    acc.total = (acc.total || 0) + 1;
    acc.byPage[curr.page_path] = (acc.byPage[curr.page_path] || 0) + 1;
    return acc;
  }, { total: 0, byPage: {} });

  return summary;
};
