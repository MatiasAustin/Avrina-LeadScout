import React, { useState, useRef } from 'react';
import { Lead, LeadStatus, Platform, LeadAnalysis, OutreachDraft, UserProfile, OutreachTone, OutreachLength } from '../types';
import { analyzeLeadPotential, generateOutreachDraft, scanLeadFromMedia, MediaItem, refineOutreachDraft } from '../services/ai';
import { 
  Plus, ExternalLink, MoreVertical, Trash2, 
  BrainCircuit, MessageCircle, CheckCircle, 
  AlertTriangle, XCircle, ChevronDown, Loader2,
  Stethoscope, Upload, Sparkles, Video, StopCircle, Film, Settings2, Copy, Send, Edit3,
  UserCheck, ClipboardCheck, ClipboardList, UserCircle
} from 'lucide-react';
import { useLeads } from '../hooks/useLeads';

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
  userBio: string; // Received detailed bio/resume text
}

const LeadManager: React.FC<Props> = ({ userJob, userNiche, userBio }) => {
  const { leads, addLead, updateLead, deleteLead } = useLeads();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // New Lead Form State
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadUrl, setNewLeadUrl] = useState('');
  const [newLeadPlatform, setNewLeadPlatform] = useState<Platform>(Platform.Google);
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [newLeadPainPoints, setNewLeadPainPoints] = useState('');
  
  // Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previews, setPreviews] = useState<{url: string, type: 'image' | 'video'}[]>([]);
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- FILE UPLOAD LOGIC ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMediaItems: MediaItem[] = [];
    const newPreviews: {url: string, type: 'image' | 'video'}[] = [];

    // Process all files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) { // 10MB limit per file
        alert(`File ${file.name} is too large (>10MB). Skipped.`);
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

  // --- SCREEN RECORDING LOGIC ---
  const startRecording = async () => {
    try {
      // Prompt user to select screen/window
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: false // usually don't need audio for website analysis
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        
        // Convert to Base64 for AI
        const reader = new FileReader();
        reader.onloadend = () => {
           const base64String = (reader.result as string).split(',')[1];
           setMediaItems(prev => [...prev, { mimeType: 'video/webm', data: base64String }]);
           setPreviews(prev => [...prev, { url: URL.createObjectURL(blob), type: 'video' }]);
        };
        reader.readAsDataURL(blob);
        
        // Stop all tracks to clear "Recording" indicator in browser
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);

      // Add a listener if user clicks "Stop sharing" via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };

    } catch (err) {
      console.error("Error starting screen record:", err);
      // User likely cancelled
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // --- EXECUTE SCAN ---
  const handleScan = async () => {
    if (mediaItems.length === 0) return;

    setIsScanning(true);
    try {
      const scanResult = await scanLeadFromMedia(mediaItems, userJob || "Freelancer");
      setNewLeadNotes(prev => prev ? prev + "\n\n[Scanned]: " + scanResult.notes : scanResult.notes);
      setNewLeadPainPoints(prev => prev ? prev + "\n\n[Scanned]: " + scanResult.painPoints : scanResult.painPoints);
      
      // Clear media after successful scan to save memory
      setMediaItems([]);
      setPreviews([]);
      alert("Scan complete! Fields updated.");
    } catch (error: any) {
      console.error(error);
      const msg = error.message || "Unknown API Error";
      alert(`Failed to scan media: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const clearMedia = () => {
    setMediaItems([]);
    setPreviews([]);
  };

  // --- ANALYZE & OUTREACH HELPERS (Existing) ---
  const handleAnalyze = async (lead: Lead) => {
    setAnalyzing(true);
    try {
      // Pass the User Bio/Resume to the analysis service
      const profile: UserProfile & { bio?: string } = { 
        jobTitle: userJob, 
        targetNiche: userNiche, 
        targetPlatform: lead.platform,
        bio: userBio 
      };

      const analysis = await analyzeLeadPotential({ 
        name: lead.name, 
        url: lead.url, 
        notes: lead.notes, 
        painPoints: lead.painPoints 
      }, profile);
      
      let newStatus = lead.status;
      if (analysis.verdict === 'Recommended') newStatus = LeadStatus.QUALIFIED;
      
      updateLead(lead.id, { analysis, status: newStatus });
      setSelectedLead({ ...lead, analysis, status: newStatus });
    } catch (e: any) {
      const msg = e.message || "Unknown Error";
      alert(`Analysis failed: ${msg}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Sub-component for Analysis view to handle local tone/length state
  const AnalysisView = ({ lead }: { lead: Lead }) => {
    // Determine default tone based on platform
    const defaultTone: OutreachTone = 
      (lead.platform === Platform.LinkedIn || lead.platform === Platform.Google) 
      ? 'Professional' 
      : 'Casual';

    const [tone, setTone] = useState<OutreachTone>(defaultTone);
    const [length, setLength] = useState<OutreachLength>('Medium');
    const [refineText, setRefineText] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleGenerateOutreach = async () => {
      if (!lead.analysis) return;
      setGenerating(true);
      try {
        const profile: UserProfile & { bio?: string } = { 
            jobTitle: userJob, 
            targetNiche: userNiche, 
            targetPlatform: lead.platform,
            bio: userBio 
        };
        const outreach = await generateOutreachDraft(
          { name: lead.name, notes: lead.notes, painPoints: lead.painPoints },
          profile,
          lead.analysis,
          tone,
          length
        );
        updateLead(lead.id, { outreach });
        setSelectedLead({ ...lead, outreach }); // update selected lead view
      } catch (e: any) {
        const msg = e.message || "Unknown Error";
        alert(`Generation failed: ${msg}`);
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
        const msg = e.message || "Unknown Error";
        alert(`Refinement failed: ${msg}`);
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
        
        {/* Lead Details Context Block */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h5 className="font-semibold text-slate-700 mb-1">About / Bio</h5>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{lead.notes || "No notes provided."}</p>
          </div>
          <div className="bg-red-50 p-3 rounded border border-red-100">
            <h5 className="font-semibold text-red-800 mb-1 flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Observed Pain Points
            </h5>
            <p className="text-red-700 leading-relaxed whitespace-pre-wrap">{lead.painPoints || "No specific problems noted."}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Analysis Card */}
          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 h-fit">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-slate-700" />
                AI Analysis
              </h4>
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                lead.analysis?.verdict === 'Recommended' ? 'bg-green-100 text-green-700' : 
                lead.analysis?.verdict === 'Caution' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
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
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <p className="font-semibold text-green-700 text-xs mb-1">PROS</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {lead.analysis.pros.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-red-700 text-xs mb-1">CONS</p>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {lead.analysis.cons.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
                
                {/* Generation Controls */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="w-3 h-3 text-slate-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">Message Style</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <select 
                      value={tone}
                      onChange={e => setTone(e.target.value as OutreachTone)}
                      className="text-xs px-2 py-1.5 border border-slate-300 rounded focus:border-slate-500 outline-none bg-slate-50 text-slate-700"
                    >
                      <option value="Casual">Casual (Hey! 👋)</option>
                      <option value="Semi-Formal">Semi-Formal (Hi Name)</option>
                      <option value="Professional">Professional (Dear..)</option>
                    </select>

                    <select 
                      value={length}
                      onChange={e => setLength(e.target.value as OutreachLength)}
                      className="text-xs px-2 py-1.5 border border-slate-300 rounded focus:border-slate-500 outline-none bg-slate-50 text-slate-700"
                    >
                      <option value="Short">Short (Brief DM)</option>
                      <option value="Medium">Medium (Standard)</option>
                      <option value="Long">Long (Detailed Email)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleGenerateOutreach}
                    disabled={generating}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition"
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                    {lead.outreach ? "Regenerate Message" : "Generate Outreach Strategy"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                {userBio ? (
                  <div className="mb-4 text-xs text-green-700 bg-green-50 p-2 rounded flex items-center justify-center gap-2">
                    <UserCheck className="w-3 h-3" />
                    Analyzing against your Resume/Bio
                  </div>
                ) : (
                   <div className="mb-4 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                    Tip: Add a Bio/Resume in "Find Clients" for better accuracy.
                  </div>
                )}

                <button
                    onClick={() => handleAnalyze(lead)}
                    disabled={analyzing}
                    className="bg-slate-50 border border-slate-300 hover:bg-slate-100 text-slate-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 mx-auto text-sm font-medium transition"
                  >
                    {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    Analyze Fit
                  </button>
              </div>
            )}
          </div>

          {/* Outreach Card */}
          {lead.outreach && (
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm ring-1 ring-slate-100 flex flex-col h-full">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Outreach Strategy
                </h4>
                <div className="flex gap-2">
                  <a 
                    href={lead.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-xs flex items-center gap-1 text-blue-600 hover:underline px-2 py-1 rounded hover:bg-blue-50"
                  >
                    Go to Profile <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              
              <div className="space-y-4 text-sm flex-1 flex flex-col">
                
                {/* PRE-OUTREACH CHECKLIST (ACTION PLAN) */}
                {lead.outreach.preparationSteps && lead.outreach.preparationSteps.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h5 className="font-bold text-amber-800 text-xs uppercase mb-2 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4" />
                      Pre-Outreach Action Plan
                    </h5>
                    <div className="space-y-2">
                      {lead.outreach.preparationSteps.map((step, idx) => (
                        <div key={idx} className="flex items-start gap-2 group">
                          <input type="checkbox" className="mt-1 border-amber-300 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
                          <label className="text-amber-900 text-xs leading-relaxed cursor-pointer opacity-90 group-hover:opacity-100">
                            {step}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-100 p-4 rounded border border-slate-200 relative group flex-1">
                  {lead.outreach.subject && <p className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Subject: {lead.outreach.subject}</p>}
                  <p className="whitespace-pre-wrap text-slate-700 font-mono text-sm leading-relaxed">{lead.outreach.messageBody}</p>
                  
                  <button 
                    onClick={handleCopy}
                    className="absolute top-2 right-2 p-2 bg-slate-50 shadow-sm border border-slate-200 rounded text-slate-500 hover:text-slate-800 transition opacity-0 group-hover:opacity-100"
                    title="Copy to Clipboard"
                  >
                    {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Refinement Box */}
                <form onSubmit={handleRefineOutreach} className="flex gap-2 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200">
                  <div className="p-2 text-slate-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <input 
                    type="text" 
                    value={refineText}
                    onChange={(e) => setRefineText(e.target.value)}
                    placeholder="AI Edit: 'Make it shorter', 'Translate to Indo'..." 
                    className="flex-1 bg-transparent border-none outline-none text-xs text-slate-700 placeholder-slate-400"
                  />
                  <button 
                    type="submit" 
                    disabled={!refineText || isRefining}
                    className="p-2 bg-slate-50 rounded-md border border-slate-200 shadow-sm hover:bg-slate-200 disabled:opacity-50 text-slate-600 transition"
                  >
                    {isRefining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Edit3 className="w-3 h-3" />}
                  </button>
                </form>

                {lead.status === LeadStatus.QUALIFIED && (
                  <button 
                    onClick={() => {
                      updateLead(lead.id, { status: LeadStatus.CONTACTED });
                      setSelectedLead(prev => prev ? ({ ...prev, status: LeadStatus.CONTACTED }) : null);
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition"
                  >
                    Mark as Contacted
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h2 className="text-xl font-semibold text-slate-800">Lead Database</h2>
          {userJob && (
             <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
               <UserCircle className="w-3 h-3" />
               Analyzing as: <span className="font-medium">{userJob}</span> 
               {userNiche && <span>in <span className="font-medium">{userNiche}</span></span>}
             </div>
          )}
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Add Lead Modal/Form Area */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-50 rounded-2xl shadow-2xl max-w-lg w-full p-6 transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">Add New Lead</h3>
              <button onClick={() => { setIsFormOpen(false); resetForm(); }} className="text-slate-400 hover:text-slate-600 transition">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddLead} className="space-y-5">
              
              {/* Magic Scan Section */}
              <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                <label className="block text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-600" />
                  Magic Scan: Screenshots or Recording
                </label>
                
                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanning || isRecording}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Files
                  </button>

                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isScanning}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition shadow-sm border ${
                      isRecording 
                        ? 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200' 
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {isRecording ? <StopCircle className="w-4 h-4 animate-pulse" /> : <Video className="w-4 h-4" />}
                    {isRecording ? "Stop Recording" : "Record Screen"}
                  </button>

                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                </div>

                {/* Previews */}
                {previews.length > 0 && (
                  <div className="mb-3 flex gap-2 overflow-x-auto pb-2">
                    {previews.map((prev, idx) => (
                      <div key={idx} className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border border-slate-200 bg-slate-100 group">
                        {prev.type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                             <Film className="w-8 h-8" />
                          </div>
                        ) : (
                          <img src={prev.url} alt="preview" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 hidden group-hover:flex items-center justify-center">
                           <span className="text-xs text-white font-medium">{idx + 1}</span>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={clearMedia} className="text-xs text-slate-400 underline self-center ml-2">Clear</button>
                  </div>
                )}

                {/* Action Button */}
                {mediaItems.length > 0 && (
                  <button
                    type="button"
                    onClick={handleScan}
                    disabled={isScanning || isRecording}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-900 transition shadow-sm disabled:bg-slate-300"
                  >
                    {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    {isScanning ? "Scanning Media..." : `Scan ${mediaItems.length} File(s)`}
                  </button>
                )}
                
                <p className="text-xs text-slate-500 mt-2">
                  Upload multiple screenshots or record a quick video scroll of the lead's profile.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name / Company</label>
                <input 
                  required 
                  value={newLeadName} 
                  onChange={e => setNewLeadName(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-sm text-slate-800"
                  placeholder="e.g. Acme Corp or John Doe"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Profile Link (URL)</label>
                <input 
                  required 
                  value={newLeadUrl} 
                  onChange={e => setNewLeadUrl(e.target.value)} 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-sm text-slate-800"
                  type="url" 
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              
              <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1.5">Platform</label>
                 <div className="relative">
                   <select 
                    value={newLeadPlatform} 
                    onChange={e => setNewLeadPlatform(e.target.value as Platform)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-sm appearance-none cursor-pointer text-slate-800"
                   >
                     {Object.values(Platform).map(p => <option key={p} value={p} className="bg-slate-50 text-slate-800">{p}</option>)}
                   </select>
                   <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                     <ChevronDown className="w-4 h-4" />
                   </div>
                 </div>
              </div>

              {/* Enhanced Data Inputs */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    About / Quick Bio
                    <span className="text-slate-400 font-normal ml-1 text-xs">(Context)</span>
                  </label>
                  <textarea 
                    required 
                    value={newLeadNotes} 
                    onChange={e => setNewLeadNotes(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all text-sm min-h-[80px] text-slate-800" 
                    placeholder="e.g. A coffee shop in Jakarta focusing on manual brew..." 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-red-700 mb-1.5 flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5" />
                    Observed Pain Points / Problems
                    <span className="text-red-400 font-normal ml-1 text-xs">(Critical for AI)</span>
                  </label>
                  <textarea 
                    value={newLeadPainPoints} 
                    onChange={e => setNewLeadPainPoints(e.target.value)} 
                    className="w-full px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg focus:bg-slate-100 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all text-sm min-h-[80px] text-slate-800 placeholder-red-300" 
                    placeholder="e.g. Their website takes 10s to load, their last Instagram post was 2 months ago, logo looks pixelated..." 
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => { setIsFormOpen(false); resetForm(); }} 
                  className="px-5 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-100 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-900 transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead List - Switched bg-white to bg-slate-50 */}
      <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {leads.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No leads yet. Use the Search Strategy tab to find some, then add them here!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <div key={lead.id} className="group">
                <div 
                  className={`p-4 hover:bg-slate-100 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${selectedLead?.id === lead.id ? 'bg-slate-100' : ''}`}
                  onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-800">{lead.name}</h3>
                      <a href={lead.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-slate-400 hover:text-slate-700">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">{lead.platform}</span>
                      <span>•</span>
                      <span>{new Date(lead.dateAdded).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{lead.niche}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <select 
                      onClick={e => e.stopPropagation()}
                      value={lead.status}
                      onChange={(e) => updateLead(lead.id, { status: e.target.value as LeadStatus })}
                      className={`text-xs font-medium px-2 py-1 rounded border-none outline-none cursor-pointer ${getStatusColor(lead.status)}`}
                    >
                      {Object.values(LeadStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                      className="text-slate-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${selectedLead?.id === lead.id ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Detail View - Switched bg-white to bg-slate-50 */}
                {selectedLead?.id === lead.id && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50">
                     <AnalysisView lead={lead} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadManager;