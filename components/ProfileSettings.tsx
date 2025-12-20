import React, { useState, useRef, useEffect } from 'react';
import { Language, User } from '../types';
import { updateUserProfile } from '../services/profile';
import { deleteAccount, updateEmail, updatePassword } from '../services/auth';
import { parseResumeFromFile } from '../services/ai';
import { Save, Loader2, Upload, FileText, UserCircle, Briefcase, Target, CheckCircle, Trash2, AlertTriangle, Mail, Lock, ShieldCheck } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface Props {
  user: User;
  onProfileUpdate: (data: { jobTitle: string; niche: string; bio: string }) => void;
  language?: Language; // Added to support translations
}

const ProfileSettings: React.FC<Props> = ({ user, onProfileUpdate, language = 'en' }) => {
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [niche, setNiche] = useState(user.niche || '');
  const [bio, setBio] = useState(user.bio || '');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const t = (key: any) => getTranslation(language, key);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);

    try {
      // 1. Validate Password if provided
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error(t('prof_err_match'));
        }
      }

      // 2. Update Profile Table (Name, Job, Niche, Bio)
      await updateUserProfile(user.id, { jobTitle, niche, bio, name });
      
      // 3. Update Auth User (Email, Password) - Supabase Only
      if (user.role !== 'guest' && user.id !== 'local-admin') {
        if (email !== user.email) {
          await updateEmail(email);
          alert(t('prof_email_hint'));
        }
        if (newPassword) {
          await updatePassword(newPassword);
        }
      }
      
      // Update global state in App.tsx
      onProfileUpdate({ jobTitle, niche, bio });
      
      setSaveSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Unknown error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCV(true);
    setErrorMsg(null);
    try {
      const summary = await parseResumeFromFile(file);
      setBio(summary);
      
      // Auto-save the new bio
      await updateUserProfile(user.id, { jobTitle, niche, bio: summary, name });
      onProfileUpdate({ jobTitle, niche, bio: summary });
      setSaveSuccess(true);
      
      alert("Bio successfully extracted and saved!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to parse CV.");
      console.error(err);
    } finally {
      setIsParsingCV(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMessage = "Are you absolutely sure?\n\nThis will DELETE ALL your leads, settings, and profile data permanently.\nThis action cannot be undone.";
    if (window.confirm(confirmMessage)) {
       if (window.confirm("Last chance: Delete account permanently?")) {
         setIsDeleting(true);
         try {
           await deleteAccount(user.id);
           window.location.reload();
         } catch (e: any) {
           alert("Failed to delete account: " + e.message);
           setIsDeleting(false);
         }
       }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <div className="bg-slate-50 p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <UserCircle className="w-7 h-7 text-slate-700" />
          {t('prof_title')}
        </h2>
        <p className="text-slate-500 text-sm mb-8">
          {t('prof_subtitle')}
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Section 1: Personal & Professional Info */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 shadow-sm"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  Job Title / Role
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={e => setJobTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 shadow-sm"
                  placeholder="e.g. Web Developer"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" />
                  Target Niche
                </label>
                <input
                  type="text"
                  value={niche}
                  onChange={e => setNiche(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 shadow-sm"
                  placeholder="e.g. SaaS, F&B"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Professional Bio
                </label>
                
                <input 
                   type="file" 
                   accept="image/*,application/pdf,.doc,.docx" 
                   ref={cvInputRef} 
                   className="hidden" 
                   onChange={handleCVUpload}
                 />
                 <button
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  disabled={isParsingCV}
                  className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition border border-slate-200"
                >
                  {isParsingCV ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  Auto-fill
                </button>
              </div>
              
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 min-h-[120px] leading-relaxed shadow-sm"
                placeholder="Describe your experience and unique skills..."
              />
            </div>
          </div>

          {/* Section 2: Account Security */}
          <div className="pt-8 border-t border-slate-100 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {t('prof_section_account')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('prof_email_label')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={user.role === 'guest'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 disabled:opacity-50 shadow-sm"
                    placeholder="you@example.com"
                  />
                </div>
                {user.role !== 'guest' && <p className="text-[10px] text-slate-400 mt-1.5">{t('prof_email_hint')}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('prof_pass_label')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    disabled={user.role === 'guest'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 disabled:opacity-50 shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('prof_pass_confirm')}</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={user.role === 'guest'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 disabled:opacity-50 shadow-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>
            {user.role !== 'guest' && <p className="text-[10px] text-slate-400">{t('prof_pass_hint')}</p>}
          </div>

          <div className="pt-8 border-t border-slate-100 flex items-center justify-end gap-3">
             {saveSuccess && (
               <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-fade-in">
                 <CheckCircle className="w-4 h-4" />
                 {t('prof_success')}
               </span>
             )}
             <button
              type="submit"
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-xl active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save All Changes
            </button>
          </div>
        </form>
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-50 p-6 md:p-8 rounded-2xl border border-red-100 shadow-sm">
        <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-red-700 mb-6 opacity-80 leading-relaxed">
          Deleting your account is permanent. All leads, strategies, and profile data will be erased from our cloud servers and cannot be recovered.
        </p>
        
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={handleDeleteAccount}
            disabled={isDeleting}
            className="bg-white border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
          >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {isDeleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;