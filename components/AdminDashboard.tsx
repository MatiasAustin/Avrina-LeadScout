import React, { useState, useEffect, useRef } from 'react';
import { getAllUsers, getConfig, saveConfig, sendPasswordReset } from '../services/auth';
import { User, AppConfig } from '../types';
import { Save, ShieldAlert, Users, DollarSign, KeyRound, Info, Loader2, ExternalLink, Coffee, Heart, Zap, Megaphone, Share2, Check, PenTool, Type, Image, AlertTriangle, Upload, X } from 'lucide-react';

interface Props {
  onConfigUpdate?: (config: AppConfig) => void;
}

const AdminDashboard: React.FC<Props> = ({ onConfigUpdate }) => {
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
    appLogo: ''
  });
  const [configSaved, setConfigSaved] = useState(false);
  const [localSaveWarning, setLocalSaveWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Logo Upload State
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled to ensure dashboard loads even if one request fails
      const [usersResult, configResult] = await Promise.allSettled([
        getAllUsers(),
        getConfig()
      ]);

      if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
      if (configResult.status === 'fulfilled') setConfig(configResult.value);
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordEmail = async (email: string) => {
    if (confirm(`Send password reset email to ${email}?`)) {
      try {
        await sendPasswordReset(email);
        alert(`Reset email sent to ${email}`);
      } catch (e: any) {
        alert("Error sending email: " + e.message);
      }
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalSaveWarning(null);
    setConfigSaved(false);

    try {
      await saveConfig(config);
      
      // Success (Cloud)
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
      
      if (onConfigUpdate) onConfigUpdate(config);

    } catch (e: any) {
      // If error message mentions "LOCALLY", it means local save worked but DB failed
      if (e.message && e.message.includes("LOCALLY")) {
        setLocalSaveWarning(e.message);
        // Still treat as 'saved' for UI purposes
        setConfigSaved(true);
        if (onConfigUpdate) onConfigUpdate(config);
      } else {
        alert("Failed to save config: " + e.message);
      }
    }
  };

  // --- LOGO COMPRESSION LOGIC ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize to max 800px to ensure < 5MB size
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to PNG to preserve transparency
          const dataUrl = canvas.toDataURL('image/png');
          resolve(dataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const compressedLogo = await compressImage(file);
      setConfig({ ...config, appLogo: compressedLogo });
    } catch (error) {
      console.error("Logo upload failed:", error);
      alert("Failed to process image. Please try a different file.");
    } finally {
      setUploadingLogo(false);
      // Reset input so same file can be selected again if needed
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const PlatformRecommendation = ({ name, url, desc, colorClass, icon }: any) => (
    <div className={`p-4 rounded-xl border ${colorClass} flex flex-col gap-2 transition hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-sm flex items-center gap-2">
          {icon} {name}
        </h4>
        <a href={url} target="_blank" rel="noreferrer" className="text-xs font-medium opacity-70 hover:opacity-100 hover:underline flex items-center gap-1">
          Visit <ExternalLink className="w-3 h-3" />
        </a>
      </div>
      <p className="text-xs opacity-80 leading-relaxed">{desc}</p>
    </div>
  );

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Changed bg-white to bg-slate-50 */}
      <div className="bg-slate-50 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <ShieldAlert className="w-6 h-6 text-slate-700" />
          </div>
          Admin Dashboard
        </h2>
        <p className="text-slate-500 mb-8 ml-1">Manage system announcements, collaboration links, and user accounts.</p>

        {/* Global Configuration Form */}
        <div className="mb-10 pb-10 border-b border-slate-100">
          <form onSubmit={handleSaveConfig} className="space-y-8">
            
            {/* Warning Banner if DB Save Fails */}
            {localSaveWarning && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3 text-orange-800">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold">Configuration Saved Locally Only</p>
                  <p className="text-xs mt-1 opacity-90">{localSaveWarning}</p>
                  <p className="text-xs mt-2 italic">Check your Supabase table 'app_config' and RLS policies.</p>
                </div>
              </div>
            )}

            {/* 0. BRANDING (New) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-700">
                  App Branding
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">App Name</label>
                   <input 
                     type="text" 
                     value={config.appName || ''}
                     onChange={e => setConfig({ ...config, appName: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                     placeholder="Avrina LeadScout"
                   />
                 </div>
                 
                 {/* LOGO UPLOAD SECTION */}
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                     Logo (URL or Upload) <Image className="w-3 h-3" />
                   </label>
                   <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={config.appLogo || ''}
                       onChange={e => setConfig({ ...config, appLogo: e.target.value })}
                       className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all truncate"
                       placeholder="https://... or Upload"
                     />
                     <input 
                        type="file" 
                        ref={logoInputRef}
                        className="hidden"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleLogoUpload}
                     />
                     <button 
                       type="button"
                       onClick={() => logoInputRef.current?.click()}
                       disabled={uploadingLogo}
                       className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors flex items-center gap-2 shrink-0"
                       title="Upload Image"
                     >
                       {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                     </button>
                     {config.appLogo && (
                       <button 
                         type="button"
                         onClick={() => setConfig({ ...config, appLogo: '' })}
                         className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl border border-red-100 transition-colors shrink-0"
                         title="Clear Logo"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     )}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-2">
                      Auto-compressed to &lt;5MB. Supports PNG (Transparent), JPG, WEBP.
                   </p>
                 </div>
              </div>
            </div>

            {/* 1. Announcement */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-700">
                  Global Announcement
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-3 ml-1">Display a banner message in the sidebar (e.g. for collaboration calls).</p>
              <input 
                 type="text" 
                 value={config.announcementText || ''}
                 onChange={e => setConfig({ ...config, announcementText: e.target.value })}
                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                 placeholder="e.g. 🚀 Open for partnerships & custom collaborations! Let's connect."
               />
            </div>

            {/* 2. Personalization & Branding (Dedication) */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <PenTool className="w-5 h-5 text-pink-600" />
                <h3 className="text-lg font-bold text-slate-700">
                   Dedication & Signature
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Dedication Message (Sidebar)</label>
                   <textarea 
                     value={config.dedicationMessage || ''}
                     onChange={e => setConfig({ ...config, dedicationMessage: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all min-h-[80px]"
                     placeholder="Your sweet message here..."
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">App Created By (Signature)</label>
                   <input 
                     type="text" 
                     value={config.signature || ''}
                     onChange={e => setConfig({ ...config, signature: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                     placeholder="Your Name"
                   />
                 </div>
              </div>
            </div>

            {/* 3. Contact & Socials */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-700">
                  Admin Contact & Collaboration
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">WhatsApp Number</label>
                   <input 
                     type="text" 
                     value={config.adminWhatsapp || ''}
                     onChange={e => setConfig({ ...config, adminWhatsapp: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                     placeholder="628123456789"
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Instagram URL</label>
                   <input 
                     type="url" 
                     value={config.adminInstagram || ''}
                     onChange={e => setConfig({ ...config, adminInstagram: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all"
                     placeholder="https://instagram.com/..."
                   />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2">LinkedIn URL</label>
                   <input 
                     type="url" 
                     value={config.adminLinkedin || ''}
                     onChange={e => setConfig({ ...config, adminLinkedin: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-all"
                     placeholder="https://linkedin.com/in/..."
                   />
                 </div>
              </div>
            </div>

            {/* 4. Donation */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-700">
                  Donation Link
                </h3>
              </div>
              <div className="flex gap-4 items-end">
                 <div className="flex-1">
                   <input 
                     type="url" 
                     value={config.donationLink}
                     onChange={e => setConfig({ ...config, donationLink: e.target.value })}
                     className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:bg-slate-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-400"
                     placeholder="https://buymeacoffee.com/yourname"
                   />
                 </div>
                 <button 
                   type="submit"
                   className={`px-8 py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 min-w-[140px] justify-center ${
                     configSaved 
                       ? 'bg-green-600 text-white hover:bg-green-700' 
                       : 'bg-slate-800 text-white hover:bg-slate-900 active:scale-95'
                   }`}
                 >
                   {configSaved ? (
                      <>Saved <Check className="w-4 h-4" /></>
                   ) : (
                      <>Save All <Save className="w-4 h-4" /></>
                   )}
                 </button>
              </div>
            </div>
          </form>

          {/* Recommendations Panel */}
          <div className="mt-8 bg-slate-100 p-6 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-500 uppercase mb-4 block tracking-wide">Recommended Donation Platforms</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PlatformRecommendation 
                name="Buy Me a Coffee" 
                url="https://buymeacoffee.com" 
                desc="Global standard. Cards & PayPal."
                colorClass="bg-yellow-50 border-yellow-200 text-yellow-900"
                icon={<Coffee className="w-4 h-4 text-yellow-600" />}
              />
              <PlatformRecommendation 
                name="Saweria" 
                url="https://saweria.co" 
                desc="Indonesia (QRIS, GoPay, OVO)."
                colorClass="bg-emerald-50 border-emerald-200 text-emerald-900"
                icon={<Zap className="w-4 h-4 text-emerald-600" />}
              />
              <PlatformRecommendation 
                name="Ko-fi" 
                url="https://ko-fi.com" 
                desc="0% Fees. PayPal direct."
                colorClass="bg-sky-50 border-sky-200 text-sky-900"
                icon={<Heart className="w-4 h-4 text-sky-600" />}
              />
            </div>
          </div>
        </div>

        {/* User Management */}
        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-slate-700" />
            User Management ({users.length})
          </h3>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(user => (
                    <tr key={user.id} className="bg-slate-50 hover:bg-slate-100 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">{user.name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${
                          user.role === 'admin' 
                            ? 'bg-purple-50 text-purple-700 border-purple-200' 
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'admin' && (
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleResetPasswordEmail(user.email)}
                              className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                              title="Send Password Reset Email"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              Reset Password
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;