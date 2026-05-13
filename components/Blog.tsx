import React, { useState, useEffect } from 'react';
import { BlogPost } from '../types';
import { getPublishedPosts } from '../services/blog';
import { trackVisitor } from '../services/stats';
import { Calendar, User, ArrowLeft, Clock, Share2, Facebook, Twitter, Linkedin, ChevronRight, Loader2, Sparkles } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const Blog: React.FC<Props> = ({ onBack }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    trackVisitor('blog_home');
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await getPublishedPosts();
      setPosts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePostClick = (post: BlogPost) => {
    setSelectedPost(post);
    trackVisitor(`blog_post_${post.slug}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Blog Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button 
            onClick={selectedPost ? () => setSelectedPost(null) : onBack}
            className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            {selectedPost ? 'Back to Blog' : 'Back to Home'}
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-black text-slate-800 tracking-tight">LeadScout Blog</span>
          </div>
          <div className="w-20"></div> {/* Spacer */}
        </div>
      </nav>

      <main className="pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          
          {selectedPost ? (
            <article className="animate-fade-in">
              <div className="mb-10 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full mb-6">
                   Expert Strategy
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
                  {selectedPost.title}
                </h1>
                <div className="flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(selectedPost.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    5 min read
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Admin
                  </div>
                </div>
              </div>

              {selectedPost.imageUrl && (
                <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
                  <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full h-auto max-h-[500px] object-cover" />
                </div>
              )}

              <div className="max-w-3xl mx-auto">
                <div className="prose prose-slate prose-indigo lg:prose-lg">
                   {/* In a real app we'd use a markdown renderer here */}
                   <div className="whitespace-pre-wrap text-slate-700 leading-relaxed text-lg">
                     {selectedPost.content}
                   </div>
                </div>

                <div className="mt-16 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex items-center gap-4">
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm"><Facebook className="w-5 h-5 text-blue-600" /></button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm"><Twitter className="w-5 h-5 text-sky-500" /></button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm"><Linkedin className="w-5 h-5 text-indigo-700" /></button>
                    <button className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition shadow-sm"><Share2 className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <button 
                    onClick={() => setSelectedPost(null)}
                    className="flex items-center gap-2 text-indigo-600 font-bold hover:gap-3 transition"
                  >
                    Continue Reading More <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <>
              <div className="mb-16 text-center">
                <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tight">Resources for <span className="text-indigo-600">Growth.</span></h1>
                <p className="text-slate-500 text-lg max-w-2xl mx-auto">Master the art of client acquisition with our latest strategies, case studies, and tool guides.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {posts.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-400 font-medium">No articles yet. Check back soon!</p>
                  </div>
                ) : posts.map(post => (
                  <div 
                    key={post.id} 
                    onClick={() => handlePostClick(post)}
                    className="group bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer"
                  >
                    {post.imageUrl && (
                      <div className="h-56 overflow-hidden">
                        <img 
                          src={post.imageUrl} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                        />
                      </div>
                    )}
                    <div className="p-8">
                      <div className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Strategy</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition line-clamp-2 leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                        {post.excerpt || post.content.substring(0, 150) + '...'}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs font-bold text-indigo-600 group-hover:translate-x-1 transition flex items-center gap-1">
                          Read More <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Blog;
