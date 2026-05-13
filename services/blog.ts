import { supabase, isSupabaseConfigured } from "./supabase";
import { BlogPost } from "../types";

export const getPublishedPosts = async (): Promise<BlogPost[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDbPost);
};

export const getAllPosts = async (): Promise<BlogPost[]> => {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(mapDbPost);
};

export const getPostBySlug = async (slug: string): Promise<BlogPost | null> => {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('blogs')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return mapDbPost(data);
};

export const savePost = async (post: Partial<BlogPost>) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");

  const dbPost = {
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    image_url: post.imageUrl,
    status: post.status,
    author_id: post.authorId,
    updated_at: new Date().toISOString()
  };

  if (post.id) {
    const { error } = await supabase
      .from('blogs')
      .update(dbPost)
      .eq('id', post.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('blogs')
      .insert({ ...dbPost, created_at: new Date().toISOString() });
    if (error) throw error;
  }
};

export const deletePost = async (id: string) => {
  if (!isSupabaseConfigured) throw new Error("Supabase not configured");
  const { error } = await supabase.from('blogs').delete().eq('id', id);
  if (error) throw error;
};

const mapDbPost = (p: any): BlogPost => ({
  id: p.id,
  title: p.title,
  slug: p.slug,
  content: p.content,
  excerpt: p.excerpt,
  imageUrl: p.image_url,
  authorId: p.author_id,
  status: p.status,
  createdAt: p.created_at,
  updatedAt: p.updated_at
});
