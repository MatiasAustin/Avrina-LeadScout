import React, { useState, useEffect } from 'react';
import { User, Testimonial } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { MessageSquare, ThumbsUp, UserCircle, Send, Lock, ArrowRight, LogIn } from 'lucide-react';

interface Props {
  user: User;
  onRegisterClick: () => void;
}

const Community: React.FC<Props> = ({ user, onRegisterClick }) => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    setLoading(true);
    // Local Mode fallback
    if (!isSupabaseConfigured) {
       const saved = localStorage.getItem('avrina_testimonials');
       if (saved) setTestimonials(JSON.parse(saved));
       setLoading(false);
       return;
    }

    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setTestimonials(data.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.user_name,
        userRole: t.user_role,
        content: t.content,
        date: t.created_at
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setSubmitting(true);
    const newTestimonial: Testimonial = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      userRole: user.jobTitle || 'Freelancer',
      content: content,
      date: new Date().toISOString()
    };

    // Optimistic Update
    const updatedList = [newTestimonial, ...testimonials];
    setTestimonials(updatedList);
    setContent('');

    if (!isSupabaseConfigured) {
      localStorage.setItem('avrina_testimonials', JSON.stringify(updatedList));
    } else {
      await supabase.from('testimonials').insert({
        user_id: user.id,
        user_name: user.name,
        user_role: user.jobTitle || 'Freelancer',
        content: content
      });
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-slate-700" />
          Community Wall
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          Share your success stories or feedback about using LeadScout.
        </p>

        {/* Input Form / Guest CTA */}
        {user.role === 'guest' ? (
          <div className="mb-8 bg-slate-100 border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-4 group hover:border-slate-300 transition-colors">
            <div className="p-4 bg-slate-50 rounded-full shadow-sm border border-slate-100">
              <Lock className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-slate-800 font-bold text-lg">Join the Conversation</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Guest users can view posts, but you need to sign in to share your own success stories and connect with the community.
              </p>
            </div>
            <button
              onClick={onRegisterClick}
              className="mt-2 bg-slate-800 hover:bg-slate-900 text-slate-50 px-6 py-2.5 rounded-lg font-medium transition shadow-md hover:shadow-lg flex items-center gap-2 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Login or Register Now
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative">
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full p-4 pr-12 bg-slate-50 border border-slate-200 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition resize-none text-sm text-slate-800 placeholder-slate-400"
                placeholder="Share your experience..."
                rows={3}
              />
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="absolute bottom-3 right-3 p-2 bg-slate-800 text-slate-50 rounded-md hover:bg-slate-900 disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-1">
              Posting as <span className="font-semibold">{user.name}</span>
            </p>
          </form>
        )}

        {/* List */}
        <div className="space-y-4">
          {testimonials.length === 0 && !loading && (
             <div className="text-center py-10 text-slate-400 text-sm italic">
               No testimonials yet. Be the first to post!
             </div>
          )}
          
          {testimonials.map((t) => (
            <div key={t.id} className="bg-slate-100 border border-slate-100 p-4 rounded-lg flex gap-3">
               <div className="flex-shrink-0">
                 <div className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
                   <UserCircle className="w-6 h-6" />
                 </div>
               </div>
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <span className="font-bold text-slate-800 text-sm">{t.userName}</span>
                   {t.userRole && <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">{t.userRole}</span>}
                   <span className="text-[10px] text-slate-400">• {new Date(t.date).toLocaleDateString()}</span>
                 </div>
                 <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                   {t.content}
                 </p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Community;