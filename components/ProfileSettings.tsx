import React, { useState, useRef } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/profile';
import { parseResumeFromFile } from '../services/ai';
import { Save, Loader2, Upload, FileText, UserCircle, Briefcase, Target, CheckCircle } from 'lucide-react';

interface Props {
  user: User;
  onProfileUpdate: (data: { jobTitle: string; niche: string; bio: string }) => void;
}

const ProfileSettings: React.FC<Props> = ({ user, onProfileUpdate }) => {
  const [jobTitle, setJobTitle] = useState(user.jobTitle || '');
  const [niche, setNiche] = useState(user.niche || '');
  const [bio, setBio] = useState(user.bio || '');
  const [name, setName] = useState(user.name || '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateUserProfile(user.id, { jobTitle, niche, bio, name });
      
      // Update global state in App.tsx
      onProfileUpdate({ jobTitle, niche, bio });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error(error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCV(true);
    try {
      const summary = await parseResumeFromFile(file);
      setBio(summary);
      alert("Bio successfully extracted from CV! Review and Save.");
    } catch (err) {
      alert("Failed to parse CV. Ensure it's a valid PDF, JPG, or DOCX file.");
      console.error(err);
    } finally {
      setIsParsingCV(false);
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-slate-700" />
          My Professional Profile
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          This data will be used by the AI to analyze leads and generate outreach messages across the app.
        </p>

        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Personal Info */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-slate-800"
              placeholder="Your Name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5" />
                Job Title / Role
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-slate-800"
                placeholder="e.g. Web Developer"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Target Niche
              </label>
              <input
                type="text"
                value={niche}
                onChange={e => setNiche(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-slate-800"
                placeholder="e.g. SaaS, F&B"
              />
            </div>
          </div>

          {/* BIO & CV UPLOAD */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-slate-700 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                Professional Bio / Resume Summary
              </label>
              
              <div>
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
                  className="text-xs flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200 font-medium"
                >
                  {isParsingCV ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isParsingCV ? "Parsing..." : "Auto-fill from CV"}
                </button>
              </div>
            </div>
            
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-slate-800 min-h-[150px] leading-relaxed text-sm"
              placeholder="Paste your bio here or upload your CV to auto-generate. Include your skills, experience, and what makes you unique."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">
              This bio is the "Benchmark" for all AI analysis.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
             {saveSuccess && (
               <span className="text-green-600 text-sm font-medium flex items-center gap-1 animate-fade-in">
                 <CheckCircle className="w-4 h-4" />
                 Profile Saved!
               </span>
             )}
             <button
              type="submit"
              disabled={isSaving}
              className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:active:scale-100"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;