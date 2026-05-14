import React, { useState, useEffect, useRef } from 'react';
import { getAllUsers, getConfig, saveConfig, sendPasswordReset } from '../services/auth';
import { User, AppConfig, BlogPost, VisitorStat, VisitorSummary } from '../types';
import { Save, ShieldAlert, Users, DollarSign, KeyRound, Info, Loader2, ExternalLink, Coffee, Heart, Zap, Megaphone, Share2, Check, PenTool, Type, Image, AlertTriangle, Upload, X, BarChart3, Newspaper, Plus, Trash2, Eye, LayoutDashboard, Database, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from 'recharts';
import { getVisitorStats, getVisitorSummary } from '../services/stats';
import { getAllPosts, savePost, deletePost } from '../services/blog';

interface Props {
  onConfigUpdate?: (config: AppConfig) => void;
}

type AdminTab = 'config' | 'users' | 'stats' | 'blog';

const AdminDashboard: React.FC<Props> = ({ onConfigUpdate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('config');
  const [users, setUsers] = useState<User[]>([]);
  const [config, setConfig] = useState<AppConfig>({ 
    donationLink: '',
    announcementText: '',
    adminWhatsapp: '',
    adminInstagram: '',
    adminLinkedin: '',
    dedicationMessage: '',
    signature: '',
    appName: '',
    appLogo: '',
    aiApiKey: '',
    aiProvider: 'google',
    dbUrl: ''
  });
  const [configSaved, setConfigSaved] = useState(false);
  const [localSaveWarning, setLocalSaveWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Stats State
  const [stats, setStats] = useState<VisitorStat[]>([]);
  const [statsSummary, setStatsSummary] = useState<VisitorSummary>({ total: 0, byPage: {} });

  // Blog State
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [currentPost, setCurrentPost] = useState<Partial<BlogPost>>({ title: '', slug: '', content: '', status: 'draft' });

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersResult, configResult, statsResult, summaryResult, blogResult] = await Promise.allSettled([
        getAllUsers(),
        getConfig(),
        getVisitorStats(),
        getVisitorSummary(),
        getAllPosts()
      ]);

      if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
      if (configResult.status === 'fulfilled') setConfig(configResult.value);
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
        setStatsError(null);
      } else {
        setStatsError("Visitor Stats table not found or inaccessible. Have you run the schema_update.sql?");
      }
      if (summaryResult.status === 'fulfilled') setStatsSummary(summaryResult.value);
      if (blogResult.status === 'fulfilled') setBlogPosts(blogResult.value);
      
    } catch (e) {
      console.error(e);
      setStatsError("Failed to load statistics.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSaveWarning(null);
    setConfigSaved(false);

    try {
      await saveConfig(config);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
      if (onConfigUpdate) onConfigUpdate(config);
    } catch (e: any) {
      if (e.message && e.message.includes("LOCALLY")) {
        setLocalSaveWarning(e.message);
        setConfigSaved(true);
        if (onConfigUpdate) onConfigUpdate(config);
      } else {
        alert("Failed to save config: " + e.message);
      }
    }
  };

  const handleSaveBlogPost = async () => {
    if (!currentPost.title || !currentPost.slug || !currentPost.content) {
      alert("Please fill all required fields");
      return;
    }
    try {
      await savePost(currentPost);
      setIsEditingPost(false);
      loadData();
    } catch (e: any) {
      alert("Error saving post: " + e.message);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm("Are you sure you want to delete this post?")) {
      try {
        await deletePost(id);
        loadData();
      } catch (e: any) {
        alert("Error deleting post: " + e.message);
      }
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
          else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/png'));
        };
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const compressedLogo = await compressImage(file);
      setConfig({ ...config, appLogo: compressedLogo });
    } finally {
      setUploadingLogo(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: AdminTab, label: string, icon: any }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 flex items-center gap-2 text-sm font-bold rounded-lg transition ${activeTab === id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-slate-50 p-4 md:p-8 rounded-[2rem] shadow-xl border border-slate-200/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
           <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-indigo-600" />
                Control Center
              </h2>
              <p className="text-slate-500 text-sm mt-1">Global settings, analytics, and content management.</p>
           </div>
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/60 overflow-x-auto max-w-full glass-morphism">
              <TabButton id="config" label="Settings" icon={LayoutDashboard} />
              <TabButton id="stats" label="Analytics" icon={BarChart3} />
              <TabButton id="blog" label="Blog" icon={Newspaper} />
              <TabButton id="users" label="Users" icon={Users} />
           </div>
        </div>

        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-10 animate-fade-in">
            {localSaveWarning && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-orange-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div><p className="text-sm font-bold">Local Save Active</p><p className="text-xs mt-1">{localSaveWarning}</p></div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-800"><Type className="w-5 h-5 text-indigo-600" /> <h3 className="font-bold">Branding</h3></div>
                <div className="space-y-4">
                  <input type="text" value={config.appName || ''} onChange={e => setConfig({ ...config, appName: e.target.value })} className="w-full px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition" placeholder="App Name" />
                  <div className="flex gap-2">
                    <input type="text" value={config.appLogo || ''} onChange={e => setConfig({ ...config, appLogo: e.target.value })} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs" placeholder="Logo URL" />
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    <button type="button" onClick={() => logoInputRef.current?.click()} className="p-2.5 bg-white border border-slate-200 rounded-xl">{uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}</button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-2 text-slate-800"><Brain className="w-5 h-5 text-purple-600" /> <h3 className="font-bold">AI Configuration</h3></div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <select value={config.aiProvider} onChange={e => setConfig({...config, aiProvider: e.target.value as any})} className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                      <option value="google">Google Gemini</option>
                      <option value="openai">OpenAI (GPT)</option>
                    </select>
                    <input type="password" value={config.aiApiKey || ''} onChange={e => setConfig({ ...config, aiApiKey: e.target.value })} className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="AI API Key" />
                  </div>
                  <p className="text-[10px] text-slate-400">Leave blank to use system default environment variables.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                 <div className="flex items-center gap-2 text-slate-800"><Database className="w-5 h-5 text-blue-600" /> <h3 className="font-bold">Database</h3></div>
                 <input type="text" value={config.dbUrl || ''} onChange={e => setConfig({ ...config, dbUrl: e.target.value })} className="w-full px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition" placeholder="Database API URL (Supabase)" />
               </div>
               <div className="space-y-6">
                 <div className="flex items-center gap-2 text-slate-800"><DollarSign className="w-5 h-5 text-green-600" /> <h3 className="font-bold">Donation</h3></div>
                 <input type="url" value={config.donationLink} onChange={e => setConfig({ ...config, donationLink: e.target.value })} className="w-full px-4 py-3 bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 transition" placeholder="Donation Link (Saweria/Kofi)" />
               </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button type="submit" className={`px-10 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition ${configSaved ? 'bg-green-600 text-slate-50' : 'bg-slate-900 text-slate-50 active:scale-95'}`}>
                {configSaved ? <><Check className="w-5 h-5" /> Saved</> : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-8 animate-fade-in">
             {statsError && (
               <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-4 text-indigo-900">
                  <Database className="w-6 h-6 shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold">Statistics Setup Required</h4>
                    <p className="text-sm opacity-80 mt-1">It looks like the visitor tracking table is not set up in your Supabase database yet.</p>
                    <div className="mt-4 flex gap-3">
                       <button 
                        onClick={() => window.open('https://supabase.com/dashboard/project/_/sql', '_blank')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700 transition"
                       >
                         Open SQL Editor
                       </button>
                    </div>
                  </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200/50 text-center hover:bg-slate-100 transition shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Visits</p>
                   <p className="text-4xl font-black text-slate-800">{statsSummary.total}</p>
                </div>
                <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200/50 text-center hover:bg-slate-100 transition shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Top Page</p>
                   <p className="text-xl font-black text-slate-800 truncate">{Object.entries(statsSummary.byPage).sort((a,b) => (b[1] as number) - (a[1] as number))[0]?.[0] || 'N/A'}</p>
                </div>
                <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200/50 text-center hover:bg-slate-100 transition shadow-sm">
                   <p className="text-xs font-bold text-slate-400 uppercase mb-2">Unique IPs</p>
                   <p className="text-4xl font-black text-slate-800">{new Set(stats.map(s => s.ipAddress)).size}</p>
                </div>
             </div>

             <div className="bg-slate-100/30 p-6 rounded-3xl border border-slate-200/50 shadow-inner">
                <h4 className="font-bold mb-6 flex items-center gap-2 text-slate-700"><BarChart3 className="w-5 h-5" /> Traffic Activity</h4>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.slice(0, 50).reverse()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="timestamp" hide />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="id" stroke="#6366f1" fill="#818cf8" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'blog' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Content Manager</h3>
                <button 
                  onClick={() => { setIsEditingPost(true); setCurrentPost({ title: '', slug: '', content: '', status: 'draft' }); }}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Post
                </button>
             </div>

             {isEditingPost ? (
               <div className="bg-slate-50 p-8 rounded-2xl border border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                     <input type="text" value={currentPost.title} onChange={e => setCurrentPost({...currentPost, title: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none font-bold" placeholder="Post Title" />
                     <input type="text" value={currentPost.slug} onChange={e => setCurrentPost({...currentPost, slug: e.target.value})} className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="url-slug" />
                  </div>
                  <input type="text" value={currentPost.imageUrl || ''} onChange={e => setCurrentPost({...currentPost, imageUrl: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none" placeholder="Image URL" />
                  <textarea value={currentPost.content} onChange={e => setCurrentPost({...currentPost, content: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none min-h-[300px]" placeholder="Content (Markdown supported)..." />
                  <div className="flex justify-between">
                     <select value={currentPost.status} onChange={e => setCurrentPost({...currentPost, status: e.target.value as any})} className="px-4 py-2 bg-white border border-slate-200 rounded-xl">
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                     </select>
                     <div className="flex gap-3">
                        <button onClick={() => setIsEditingPost(false)} className="px-6 py-2 text-slate-500 font-bold">Cancel</button>
                        <button onClick={handleSaveBlogPost} className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg">Save Post</button>
                     </div>
                  </div>
               </div>
             ) : (
               <div className="grid grid-cols-1 gap-4">
                  {blogPosts.length === 0 && <div className="p-12 text-center text-slate-400 italic">No posts yet.</div>}
                  {blogPosts.map(post => (
                    <div key={post.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          {post.imageUrl && <img src={post.imageUrl} className="w-12 h-12 rounded-lg object-cover" />}
                          <div>
                             <h4 className="font-bold text-slate-800">{post.title}</h4>
                             <p className="text-[10px] text-slate-400">/{post.slug} • {new Date(post.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${post.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>{post.status}</span>
                          <button onClick={() => { setIsEditingPost(true); setCurrentPost(post); }} className="p-2 text-slate-400 hover:text-indigo-600"><PenTool className="w-4 h-4" /></button>
                          <button onClick={() => handleDeletePost(post.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
               </div>
             )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-widest">
                  <tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Email</th><th className="px-6 py-4">Role</th><th className="px-6 py-4 text-right">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span></td>
                      <td className="px-6 py-4 text-right"><button onClick={() => sendPasswordReset(user.email)} className="text-slate-400 hover:text-slate-900 transition"><KeyRound className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;