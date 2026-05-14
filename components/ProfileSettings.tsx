import React, { useState, useRef, useEffect } from 'react';
import { Language, User } from '../types';
import { updateUserProfile } from '../services/profile';
import { deleteAccount, updateEmail, updatePassword } from '../services/auth';
import { parseResumeFromFile } from '../services/ai';
import { Save, Loader2, Upload, FileText, UserCircle, Briefcase, Target, CheckCircle, Trash2, AlertTriangle, Mail, Lock, ShieldCheck } from 'lucide-react';
import { getTranslation } from '../utils/i18n';

interface Props {
  user: User;
  onProfileUpdate: (data: { jobTitle: string; niche: string; bio: string; name: string; dailyTarget?: number; weeklyTarget?: number; monthlyTarget?: number }) => void;
  language?: Language; 
}

const ProfileSettings: React.FC<Props> = ({ user, onProfileUpdate, language = 'en' }) => {
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [niche, setNiche] = useState(user.niche || '');
  const [bio, setBio] = useState(user.bio || '');
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');

  // Productivity Targets (Benchmarks)
  const [dailyTarget, setDailyTarget] = useState(user.dailyTarget || 5);
  const [weeklyTarget, setWeeklyTarget] = useState(user.weeklyTarget || 25);
  const [monthlyTarget, setMonthlyTarget] = useState(user.monthlyTarget || 100);

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const t = (key: any) => getTranslation(language as Language, key);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg(null);
    try {
      await updateUserProfile(user.id, { 
        jobTitle, niche, bio, name, 
        dailyTarget, weeklyTarget, monthlyTarget 
      });
      onProfileUpdate({ 
        jobTitle, niche, bio, name, 
        dailyTarget, weeklyTarget, monthlyTarget 
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.role === 'guest') return;
    
    setIsSaving(true);
    setErrorMsg(null);
    try {
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error(t('prof_err_match'));
        }
        await updatePassword(newPassword);
        alert(t('prof_pass_success'));
        setNewPassword('');
        setConfirmPassword('');
      }

      if (email !== user.email) {
        await updateEmail(email);
        alert(t('prof_email_hint'));
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Failed to update security settings.");
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
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in w-full overflow-hidden">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium break-words overflow-wrap-anywhere overflow-hidden">{errorMsg}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Section 1: Personal & Professional Info */}
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
               <Briefcase className="w-4 h-4 text-indigo-600" /> Professional Profile
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-slate-100 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 shadow-sm"
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

              {/* Productivity Benchmarks */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Target className="w-4 h-4 text-rose-500" /> Productivity Benchmarks (Dashboard Goals)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Daily Goal</label>
                    <input
                      type="number"
                      value={dailyTarget}
                      onChange={e => setDailyTarget(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-800 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Weekly Goal</label>
                    <input
                      type="number"
                      value={weeklyTarget}
                      onChange={e => setWeeklyTarget(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-800 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Monthly Goal</label>
                    <input
                      type="number"
                      value={monthlyTarget}
                      onChange={e => setMonthlyTarget(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-800 shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-slate-800 hover:bg-slate-900 text-slate-50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </div>
          </form>

          {/* Section 2: Account Security */}
          <form onSubmit={handleUpdateSecurity} className="pt-10 border-t border-slate-200 space-y-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Account Security
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('prof_email_label')}</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={user.role === 'guest'}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-slate-100 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 disabled:opacity-50 shadow-sm"
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-slate-100 focus:ring-2 focus:ring-slate-800 focus:border-slate-800 outline-none transition-all text-sm text-slate-800 disabled:opacity-50 shadow-sm"
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

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-[10px] text-slate-400 italic">Leave password blank if you don't want to change it.</p>
              <button
                type="submit"
                disabled={isSaving || user.role === 'guest'}
                className="bg-slate-800 hover:bg-slate-900 text-slate-50 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 text-sm disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Update Security
              </button>
            </div>
          </form>

          {saveSuccess && (
            <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 py-3 rounded-xl border border-green-100 animate-fade-in shadow-sm">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-bold">{t('prof_success')}</span>
            </div>
          )}
        </div>
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
            className="bg-slate-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
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