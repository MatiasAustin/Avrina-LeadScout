import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Lead, LeadStatus, Platform, LeadAnalysis, OutreachDraft, UserProfile, OutreachTone, OutreachLength, Language } from '../types';
import { analyzeLeadPotential, generateOutreachDraft, scanLeadFromMedia, MediaItem, refineOutreachDraft, parseResumeFromFile } from '../services/ai';
import { 
  Plus, ExternalLink, MoreVertical, Trash2, 
  BrainCircuit, MessageCircle, CheckCircle, 
  AlertCircle, Loader2, Info, HelpCircle,
  Video, StopCircle, RefreshCw, Smartphone, 
  Camera, Clipboard, ChevronDown, ChevronRight,
  Calendar, UserCheck, Shield, Clock,
  Check, Search, FileText, Edit3, XCircle, Upload, Film, Settings2, Sparkles, Send, ClipboardList, UserCircle,
  Stethoscope, Copy
} from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { getFriendlyErrorMessage, getTranslation } from '../utils/i18n';
import HelpGuide from './HelpGuide';

const getStatusColor = (status: LeadStatus) => {
  switch (status) {
    case LeadStatus.NEW: return 'bg-slate-200 text-slate-800';
    case LeadStatus.QUALIFIED: return 'bg-blue-100 text-blue-800';
    case LeadStatus.CONTACTED: return 'bg-yellow-100 text-yellow-800';
    case LeadStatus.NEGOTIATING: return 'bg-purple-100 text-purple-800';
    case LeadStatus.WON: return 'bg-green-100 text-green-800';
    case LeadStatus.LOST: return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

interface Props {
  userJob: string;
  userNiche: string;
  userBio: string; 
  language: Language;
  onBioUpdate?: (bio: string) => void;
}

const LeadManager: React.FC<Props> = ({ userJob, userNiche, userBio, language, onBioUpdate }) => {
  const { leads, addLead, updateLead, deleteLead } = useLeads();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadUrl, setNewLeadUrl] = useState('');
  const [newLeadPlatform, setNewLeadPlatform] = useState<Platform>(Platform.Google);
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [newLeadPainPoints, setNewLeadPainPoints] = useState('');
  
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  
  // Edit Mode State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);
  
  // Recording State & Support Check
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenRecordSupported, setIsScreenRecordSupported] = useState(true);
  const [isParsingCVProfile, setIsParsingCVProfile] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvProfileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: any) => getTranslation(language, key);

  useEffect(() => {
    const supported = !!(
      navigator.mediaDevices && 
      navigator.mediaDevices.getDisplayMedia && 
      typeof MediaRecorder !== 'undefined'
    );
    setIsScreenRecordSupported(supported);
  }, []);

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    const lead: Lead = {
      id: crypto.randomUUID(),
      name: newLeadName,
      url: newLeadUrl,
      platform: newLeadPlatform,
      niche: userNiche || 'General',
      dateAdded: new Date().toISOString(),
      status: LeadStatus.NEW,
      notes: newLeadNotes,
      painPoints: newLeadPainPoints
    };
    addLead(lead);
    setIsFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNewLeadName('');
    setNewLeadUrl('');
    setNewLeadNotes('');
    setNewLeadPainPoints('');
    setMediaItems([]);
    setPreviews([]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItem[] = [];
    const newPreviews: {url: string, type: 'image' | 'video'}[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 15 * 1024 * 1024) { 
        alert(`File ${file.name} is too large (>15MB). Skipped.`);
        continue;
      }

      const reader = new FileReader();
      const p = new Promise<void>((resolve) => {
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          const type = file.type.startsWith('video') ? 'video' : 'image';
          newMediaItems.push({ mimeType: file.type, data: base64String });
          newPreviews.push({ url: URL.createObjectURL(file), type });
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await p;
    }

    setMediaItems(prev => [...prev, ...newMediaItems]);
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const handleCVProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCVProfile(true);
    try {
      const summary = await parseResumeFromFile(file);
      if (onBioUpdate) onBioUpdate(summary);
      alert("Resume parsed and synced to your profile!");
    } catch (err: any) {
      alert("Failed to parse CV: " + err.message);
    } finally {
      setIsParsingCVProfile(false);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           lead.notes.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = leads.length;
    const byStatus = leads.reduce((acc, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {} as Record<LeadStatus, number>);
    const totalValue = leads
      .filter(l => l.status === LeadStatus.WON)
      .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
    return { total, byStatus, totalValue };
  }, [leads]);

  const startRecording = async () => {
    if (!isScreenRecordSupported) {
      alert("Screen recording is not supported on this device.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64String = (reader.result as string).split(',')[1];
           setMediaItems(prev => [...prev, { mimeType: 'video/webm', data: base64String }]);
           setPreviews(prev => [...prev, { url: URL.createObjectURL(blob), type: 'video' }]);
        };
        reader.readAsDataURL(blob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };
      recorder.start();
      setIsRecording(true);
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };
    } catch (err: any) {
      console.error("Error UI recording:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const clearMedia = () => {
    setMediaItems([]);
    setPreviews([]);
  };

  const handleScan = async () => {
    if (mediaItems.length === 0) return;
    setIsScanning(true);
    try {
      const scanResult = await scanLeadFromMedia(mediaItems, userJob || "Freelancer");
      setNewLeadNotes(prev => prev ? prev + "\n\n[Scanned]: " + scanResult.notes : scanResult.notes);
      setNewLeadPainPoints(prev => prev ? prev + "\n\n[Scanned]: " + scanResult.painPoints : scanResult.painPoints);
      setMediaItems([]);
      setPreviews([]);
      alert("Scan complete!");
    } catch (error: any) {
      const msg = getFriendlyErrorMessage(error, language);
      alert(`Scan Failed: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveEdit = () => {
    if (editingLead) {
      updateLead(editingLead.id, {
        name: editingLead.name,
        url: editingLead.url,
        notes: editingLead.notes,
        painPoints: editingLead.painPoints,
        platform: editingLead.platform,
        value: editingLead.value,
        currency: editingLead.currency,
        dealType: editingLead.dealType
      });
      setEditingLead(null);
    }
  };

  const handleAnalyze = async (lead: Lead) => {
    setAnalyzing(true);
    try {
      const profile: UserProfile & { bio?: string } = { 
        jobTitle: userJob, targetNiche: userNiche, targetPlatform: lead.platform, bio: userBio 
      };
      const analysis = await analyzeLeadPotential({ 
        name: lead.name, url: lead.url, notes: lead.notes, painPoints: lead.painPoints 
      }, profile);
      let newStatus = lead.status;
      if (analysis.verdict === 'Recommended') newStatus = LeadStatus.QUALIFIED;
      updateLead(lead.id, { analysis, status: newStatus });
      setSelectedLead({ ...lead, analysis, status: newStatus });
    } catch (e: any) {
      alert(getFriendlyErrorMessage(e, language));
    } finally {
      setAnalyzing(false);
    }
  };

  const AnalysisView = ({ lead }: { lead: Lead }) => {
    const defaultTone: OutreachTone = (lead.platform === Platform.LinkedIn || lead.platform === Platform.Google) ? 'Professional' : 'Casual';
    const [tone, setTone] = useState<OutreachTone>(defaultTone);
    const [length, setLength] = useState<OutreachLength>('Medium');
    const [refineText, setRefineText] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerateOutreach = async () => {
      setGenerating(true);
      try {
        const profile: UserProfile & { bio?: string } = { jobTitle: userJob, targetNiche: userNiche, targetPlatform: lead.platform, bio: userBio };
        const outreach = await generateOutreachDraft({ name: lead.name, notes: lead.notes, painPoints: lead.painPoints }, profile, lead.analysis!, tone, length);
        updateLead(lead.id, { outreach });
        setSelectedLead({ ...lead, outreach }); 
      } catch (e: any) {
        alert(getFriendlyErrorMessage(e, language));
      } finally {
        setGenerating(false);
      }
    };

    const handleRefineOutreach = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!lead.outreach || !refineText) return;
      setIsRefining(true);
      try {
        const newOutreach = await refineOutreachDraft(lead.outreach, refineText);
        updateLead(lead.id, { outreach: newOutreach });
        setSelectedLead({ ...lead, outreach: newOutreach });
        setRefineText('');
      } catch(e: any) {
        alert(getFriendlyErrorMessage(e, language));
      } finally {
        setIsRefining(false);
      }
    };

    const handleCopy = () => {
      if (lead.outreach) {
        const text = `${lead.outreach.subject ? lead.outreach.subject + '\n\n' : ''}${lead.outreach.messageBody}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    return (
      <div className="space-y-6 animate-fade-in">
        {lead.status === LeadStatus.WON && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 space-y-4 shadow-sm animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-indigo-700 tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Client Revenue Details
              </h4>
              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Active Deal</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex bg-slate-50 border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                  <input 
                    type="number" 
                    value={lead.value || 0} 
                    onChange={e => updateLead(lead.id, { value: Number(e.target.value) })} 
                    className="w-full px-4 py-2.5 bg-transparent outline-none border-r border-indigo-100 text-sm font-bold text-slate-800" 
                    placeholder="Value" 
                  />
                  <select 
                    value={lead.currency || 'USD'} 
                    onChange={e => updateLead(lead.id, { currency: e.target.value })} 
                    className="px-3 py-2.5 bg-transparent outline-none text-sm font-bold text-slate-800"
                  >
                      <option value="USD">USD</option>
                      <option value="IDR">IDR</option>
                      <option value="EUR">EUR</option>
                  </select>
              </div>
              <select 
                value={lead.dealType || 'project'} 
                onChange={e => updateLead(lead.id, { dealType: e.target.value as 'project' | 'retainer' })} 
                className="w-full px-4 py-2.5 bg-slate-50 border border-indigo-100 rounded-xl outline-none text-sm font-bold shadow-sm text-slate-800"
              >
                  <option value="project">Project-Based</option>
                  <option value="retainer">Monthly Retainer</option>
              </select>
            </div>
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
              <UserCircle className="w-4 h-4" /> About / Bio
            </h5>
            <textarea 
              value={lead.notes || ""} 
              onChange={e => updateLead(lead.id, { notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-600 leading-relaxed text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all shadow-sm"
              placeholder="Enter details about the lead..."
            />
          </div>
          <div>
            <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Pain Points
            </h5>
            <textarea 
              value={lead.painPoints || ""} 
              onChange={e => updateLead(lead.id, { painPoints: e.target.value })}
              className="w-full bg-red-50/30 border border-red-100 rounded-lg p-3 text-red-700 leading-relaxed text-xs min-h-[120px] outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition-all shadow-sm"
              placeholder="List their problems or needs..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2"><BrainCircuit className="w-5 h-5" /> AI Analysis</h4>
              <span className={`px-2 py-1 rounded text-xs font-bold ${lead.analysis?.verdict === 'Recommended' ? 'bg-green-100 text-green-700' : lead.analysis?.verdict === 'Caution' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {lead.analysis?.verdict || 'N/A'}
              </span>
            </div>

            {lead.analysis ? (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-slate-800 h-2.5 rounded-full" style={{ width: `${lead.analysis.score}%` }}></div>
                  </div>
                  <span className="font-bold text-slate-700">{lead.analysis.score}/100</span>
                </div>
                <p className="text-slate-600 italic">"{lead.analysis.reasoning}"</p>
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <select value={tone} onChange={e => setTone(e.target.value as OutreachTone)} className="text-xs px-2 py-1.5 border border-slate-300 rounded outline-none bg-slate-50">
                      <option value="Casual">Casual</option>
                      <option value="Semi-Formal">Semi-Formal</option>
                      <option value="Professional">Professional</option>
                    </select>
                    <select value={length} onChange={e => setLength(e.target.value as OutreachLength)} className="text-xs px-2 py-1.5 border border-slate-300 rounded outline-none bg-slate-50">
                      <option value="Short">Short</option>
                      <option value="Medium">Medium</option>
                      <option value="Long">Long</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAnalyze(lead)} 
                      disabled={analyzing} 
                      className="flex-1 bg-slate-50 border border-slate-300 text-slate-700 py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs font-bold hover:bg-slate-100"
                    >
                      {analyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <BrainCircuit className="w-3 h-3" />}
                      Re-analyze Fit
                    </button>
                    <button 
                      onClick={handleGenerateOutreach} 
                      disabled={generating} 
                      className="flex-1 bg-slate-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs font-bold shadow-sm"
                    >
                      {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageCircle className="w-3 h-3" />}
                      {lead.outreach ? "Regenerate" : "Draft"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={() => handleAnalyze(lead)} disabled={analyzing} className="w-full bg-white border border-slate-300 py-3 rounded-lg flex items-center justify-center gap-2 transition font-bold">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                Analyze Fit
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 flex flex-col h-full min-h-[300px]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2"><Send className="w-5 h-5 text-blue-600" /> Outreach Message</h4>
              <button onClick={handleCopy} className="p-2 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:text-slate-800 transition">
                {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <div className="bg-slate-50 rounded-lg border border-slate-200 flex-1 overflow-hidden flex flex-col">
               <textarea 
                 value={lead.outreach?.messageBody || ""} 
                 onChange={e => {
                   const currentOutreach = lead.outreach || { 
                     messageBody: "", 
                     visualSuggestions: [], 
                     preparationSteps: [] 
                   };
                   const updatedOutreach = { ...currentOutreach, messageBody: e.target.value };
                   updateLead(lead.id, { outreach: updatedOutreach });
                 }}
                 className="flex-1 w-full p-4 whitespace-pre-wrap text-slate-700 font-mono text-xs leading-relaxed outline-none focus:bg-slate-50/50 transition-colors min-h-[200px] resize-none"
                 placeholder="Draft your message here or use AI to generate one..."
               />
            </div>
            {lead.outreach && (
              <form onSubmit={handleRefineOutreach} className="mt-4 flex gap-2 items-center bg-slate-50 p-1 rounded-lg border border-slate-200">
                <input type="text" value={refineText} onChange={e => setRefineText(e.target.value)} placeholder="Refine message..." className="flex-1 bg-transparent border-none outline-none text-xs px-2" />
                <button type="submit" disabled={!refineText || isRefining} className="p-2 bg-slate-800 text-white rounded transition">
                  {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-slate-800">{t('leads_title')}</h2>
          {userJob && <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><UserCircle className="w-3 h-3" /> {userJob} in {userNiche}</p>}
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={cvProfileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleCVProfileUpload} />
          <button onClick={() => cvProfileInputRef.current?.click()} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Sync Profile CV"><FileText className="w-5 h-5" /></button>
          <button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg" title="Guide"><HelpCircle className="w-5 h-5" /></button>
          <button onClick={() => setIsFormOpen(true)} className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm"><Plus className="w-4 h-4" /> {t('leads_btn_add')}</button>
        </div>
      </div>

      {leads.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', val: stats.total, color: 'bg-slate-50 text-slate-800' },
            { label: 'Qualified', val: stats.byStatus[LeadStatus.QUALIFIED] || 0, color: 'bg-blue-50 text-blue-700' },
            { label: 'Contacted', val: stats.byStatus[LeadStatus.CONTACTED] || 0, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Won', val: stats.byStatus[LeadStatus.WON] || 0, color: 'bg-green-50 text-green-700' },
            { label: 'Revenue', val: `$${stats.totalValue.toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700' }
          ].map(s => (
            <div key={s.label} className={`${s.color} p-4 rounded-xl border border-white shadow-sm`}>
               <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{s.label}</p>
               <p className="text-2xl font-black">{s.val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search leads..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none" />
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto whitespace-nowrap custom-scrollbar">
           {(['ALL', ...Object.values(LeadStatus)] as const).map(s => (
             <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition ${statusFilter === s ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>{s}</button>
           ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-slate-400 italic">No leads found.</div>
        ) : filteredLeads.map(lead => (
          <div key={lead.id} className="group">
            <div onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)} className={`p-5 cursor-pointer hover:bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${selectedLead?.id === lead.id ? 'bg-slate-50' : ''}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-slate-800">{lead.name}</h3>
                  <a href={lead.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-slate-800"><ExternalLink className="w-3.5 h-3.5" /></a>
                  {lead.value > 0 && <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+{lead.currency} {lead.value}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase">{lead.platform}</span>
                  <span className="text-[10px] text-slate-400 italic">{lead.niche}</span>
                  {lead.status === LeadStatus.WON && lead.dealType && (
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-tight">{lead.dealType}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={(e) => { e.stopPropagation(); setEditingLead(lead); }} className="p-2 text-slate-400 hover:text-indigo-600 md:opacity-0 md:group-hover:opacity-100 transition"><Edit3 className="w-4 h-4" /></button>
                <select value={lead.status} onClick={e => e.stopPropagation()} onChange={e => updateLead(lead.id, { status: e.target.value as LeadStatus })} className={`text-[10px] font-bold px-3 py-1 rounded-full outline-none border-none cursor-pointer ${getStatusColor(lead.status)}`}>
                  {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }} className="p-2 text-slate-400 hover:text-red-500 md:opacity-0 md:group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
                <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${selectedLead?.id === lead.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {selectedLead?.id === lead.id && (
              <div className="px-5 pb-8 pt-2 border-t border-slate-50 bg-slate-50">
                 <AnalysisView lead={lead} />
              </div>
            )}
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Add New Lead</h3>
              <button onClick={() => setIsFormOpen(false)}><XCircle className="w-6 h-6 text-slate-300" /></button>
            </div>
            <form onSubmit={handleAddLead} className="space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 bg-white border border-slate-300 py-2 rounded-lg text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-2"><Upload className="w-3.5 h-3.5" /> Upload Media</button>
                    <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`flex-1 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 border ${isRecording ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white border-slate-300 text-slate-700'}`}>
                      {isRecording ? <StopCircle className="w-3.5 h-3.5 animate-pulse" /> : <Video className="w-3.5 h-3.5" />} {isRecording ? 'Stop' : 'Screen Record'}
                    </button>
                  </div>
                  {previews.length > 0 && <div className="flex gap-2 overflow-x-auto pb-2">{previews.map((p, idx) => <div key={idx} className="w-12 h-12 rounded border bg-slate-200 flex-shrink-0 overflow-hidden">{p.type === 'video' ? <Film className="w-full h-full p-2" /> : <img src={p.url} className="w-full h-full object-cover" />}</div>)}<button type="button" onClick={clearMedia} className="text-[10px] underline">Clear</button></div>}
                  <button type="button" onClick={handleScan} disabled={mediaItems.length === 0 || isScanning} className="w-full bg-slate-800 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50">{isScanning ? 'Scanning...' : 'AI Scan from Media'}</button>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <input type="text" required value={newLeadName} onChange={e => setNewLeadName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Name / Company" />
                 <select value={newLeadPlatform} onChange={e => setNewLeadPlatform(e.target.value as Platform)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
               </div>
               <input type="url" required value={newLeadUrl} onChange={e => setNewLeadUrl(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Profile URL" />
               <textarea value={newLeadNotes} onChange={e => setNewLeadNotes(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[80px]" placeholder="Bio / Notes" />
               <textarea value={newLeadPainPoints} onChange={e => setNewLeadPainPoints(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-red-600 font-medium" placeholder="Observed Problems" />
               <button type="submit" className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg mt-2">Add to Database</button>
            </form>
          </div>
        </div>
      )}

      {editingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Edit Lead</h3><button onClick={() => setEditingLead(null)}><XCircle className="w-6 h-6 text-slate-300" /></button></div>
            <div className="space-y-4">
              <input type="text" value={editingLead.name} onChange={e => setEditingLead({...editingLead, name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="Name" />
              <input type="url" value={editingLead.url} onChange={e => setEditingLead({...editingLead, url: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" placeholder="URL" />
              <div className={`p-4 rounded-xl space-y-4 border transition-all ${editingLead.status === LeadStatus.WON ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{editingLead.status === LeadStatus.WON ? 'Financial Details (Client)' : 'Financial Potential'}</h4>
                  {editingLead.status === LeadStatus.WON && <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Deal Closed</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <input type="number" value={editingLead.value || 0} onChange={e => setEditingLead({...editingLead, value: Number(e.target.value)})} className="w-full px-4 py-2.5 bg-transparent outline-none border-r border-slate-200" placeholder="Value" />
                      <select value={editingLead.currency || 'USD'} onChange={e => setEditingLead({...editingLead, currency: e.target.value})} className="px-3 py-2.5 bg-transparent outline-none text-sm font-bold">
                          <option value="USD">USD</option>
                          <option value="IDR">IDR</option>
                          <option value="EUR">EUR</option>
                      </select>
                  </div>
                  <select value={editingLead.dealType || 'project'} onChange={e => setEditingLead({...editingLead, dealType: e.target.value as 'project' | 'retainer'})} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none text-sm font-bold shadow-sm">
                      <option value="project">Project-Based</option>
                      <option value="retainer">Monthly Retainer</option>
                  </select>
                </div>
              </div>

              <textarea value={editingLead.notes} onChange={e => setEditingLead({...editingLead, notes: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none min-h-[100px] text-sm" placeholder="Bio / Client Context" />
              <textarea value={editingLead.painPoints} onChange={e => setEditingLead({...editingLead, painPoints: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-red-600 font-medium text-sm" placeholder="Client Pain Points / Solved Problems" />
              <button onClick={handleSaveEdit} className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      <HelpGuide 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        language={language} 
        initialTab="leads" 
      />
    </div>
  );
};

export default LeadManager;