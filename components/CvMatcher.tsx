import React, { useState } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2, AlertTriangle, XCircle, Search, ArrowRight, Briefcase, RefreshCw, Sparkles, Copy, Check, HelpCircle } from 'lucide-react';
import { parseResumeFromFile, analyzeCvMatch, restructureCv, tailorResumeToJob } from '../services/ai';
import { CvAnalysisResult, Language } from '../types';
import { getTranslation } from '../utils/i18n';
import HelpGuide from './HelpGuide';

interface Props {
  language?: Language;
}

const CvMatcher: React.FC<Props> = ({ language = 'en' }) => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState<string>('');
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('text');
  const [jobInput, setJobInput] = useState('');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [result, setResult] = useState<CvAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New features state
  const [generatedResume, setGeneratedResume] = useState<string>('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const t = (key: any) => getTranslation(language as Language, key);

  const fetchJobFromUrl = async (url: string): Promise<string> => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch from URL. Try Paste Text mode.');
    const data = await response.json();
    const htmlContent = data.contents;
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const extractedText = doc.body.innerText || doc.body.textContent || '';
    return extractedText.replace(/\s+/g, ' ').trim();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      setCvText('');
      setResult(null);
      setError(null);
      setGeneratedResume('');
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.preventDefault();
    setCvFile(null);
    setCvText('');
    setResult(null);
    setError(null);
    setGeneratedResume('');
  };

  const canAnalyze = (!!cvFile || !!cvText) && !!jobInput.trim() && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!cvFile && !cvText) {
      setError('Please upload your CV/Resume first.');
      return;
    }
    if (!jobInput.trim()) {
      setError('Please provide a Job Post link or text.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setGeneratedResume('');

    try {
      let parsedCvText = cvText;
      if (!parsedCvText && cvFile) {
        parsedCvText = await parseResumeFromFile(cvFile);
        setCvText(parsedCvText);
      }

      let targetJobText = jobInput;
      if (jobInputMode === 'url') {
        try {
          targetJobText = await fetchJobFromUrl(jobInput);
          if (targetJobText.length < 50) {
            throw new Error("Could not extract enough content from the URL. Please use 'Paste Text' mode.");
          }
        } catch (e: any) {
          throw new Error(e.message || "Failed to fetch the URL. Try 'Paste Text' mode.");
        }
      }

      const analysis = await analyzeCvMatch(parsedCvText, targetJobText);
      setResult(analysis);
    } catch (e: any) {
      setError(e.message || 'An unexpected error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestructure = async () => {
    setIsOptimizing(true);
    setError(null);
    try {
      const resultResume = await restructureCv(cvText);
      setGeneratedResume(resultResume);
    } catch (e: any) {
      setError(e.message || "Failed to restructure CV.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTailor = async () => {
    setIsOptimizing(true);
    setError(null);
    try {
      const resultResume = await tailorResumeToJob(cvText, jobInput);
      setGeneratedResume(resultResume);
    } catch (e: any) {
      setError(e.message || "Failed to tailor resume.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResume) return;
    navigator.clipboard.writeText(generatedResume);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 45) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-green-50 border-green-200';
    if (score >= 45) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getRecommendationStyle = (rec: string) => {
    if (rec === 'Highly Recommended') return 'bg-green-100 text-green-800';
    if (rec === 'Good Fit') return 'bg-blue-100 text-blue-800';
    if (rec === 'Apply with Caution') return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getRecommendationTranslated = (rec: string) => {
    return rec; 
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in pb-10">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 hidden md:block">
          <Briefcase className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-blue-200" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">{t('cv_title')}</h2>
            <button
               onClick={() => setIsHelpOpen(true)}
               className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-md transition-all border border-white/20 text-white font-bold text-xs shadow-sm"
            >
              <HelpCircle className="w-4 h-4" />
              {language === 'id' ? "Bantuan" : "Help"}
            </button>
          </div>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed max-w-2xl opacity-90">
            {t('cv_subtitle')}
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">

        {/* ── LEFT COLUMN: Inputs ── */}
        <div className="space-y-6">

          {/* Step 1: CV Upload */}
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm md:text-base">
              <span className="bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black flex-shrink-0 shadow-sm">1</span>
              {t('cv_step_1')}
              {cvText && !cvFile && (
                <span className="ml-auto text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{t('cv_parsed')}</span>
              )}
            </h3>

            <label className="border-2 border-dashed border-slate-200 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-slate-50 transition-all min-h-[140px] group">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={handleFileChange} />
              {cvFile ? (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-50 p-4 rounded-full mb-3 border border-green-100">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <span className="font-bold text-slate-800 text-sm break-all max-w-full px-2">{cvFile.name}</span>
                  <span className="text-xs text-slate-400 mt-1">Ready for analysis</span>
                  <button onClick={handleRemoveFile} className="mt-3 text-xs font-bold text-red-500 hover:text-red-700 hover:underline transition uppercase tracking-widest">
                    Remove file
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-3 group-hover:bg-indigo-50 transition-colors">
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <span className="font-bold text-slate-700 text-sm">{t('cv_upload_click')}</span>
                  <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{t('cv_file_types')}</span>
                </div>
              )}
            </label>
          </div>

          {/* Step 2: Job Post */}
          <div className="bg-white p-5 md:p-8 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-sm md:text-base">
              <span className="bg-indigo-600 text-white w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-black flex-shrink-0 shadow-sm">2</span>
              {t('cv_step_2')}
            </h3>

            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4 border border-slate-200">
              <button
                onClick={() => { setJobInputMode('text'); setJobInput(''); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  jobInputMode === 'text' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> {t('cv_paste_text')}
              </button>
              <button
                onClick={() => { setJobInputMode('url'); setJobInput(''); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                  jobInputMode === 'url' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> {t('cv_paste_link')}
              </button>
            </div>

            {jobInputMode === 'url' ? (
              <div className="space-y-3">
                <input
                  type="url"
                  value={jobInput}
                  onChange={e => setJobInput(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                />
                <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-yellow-800 leading-relaxed font-medium">
                    {t('cv_link_hint')}
                  </p>
                </div>
              </div>
            ) : (
              <textarea
                value={jobInput}
                onChange={e => setJobInput(e.target.value)}
                placeholder={t('cv_placeholder_job')}
                rows={6}
                className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all resize-none text-sm font-medium leading-relaxed"
              />
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-100 flex items-start gap-3 animate-shake">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm">
                <span className="font-black block mb-0.5 uppercase tracking-wide text-xs">{t('cv_err_title')}</span>
                <p className="font-medium opacity-90">{error}</p>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={!canAnalyze}
            className="w-full py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98]"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('cv_analyzing')}
              </>
            ) : result ? (
              <>
                <RefreshCw className="w-5 h-5" />
                {t('cv_reanalyze')}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {t('cv_btn_calculate')}
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT COLUMN: Results ── */}
        <div className="space-y-6">
          {result ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in transition-all">

              {/* Score header */}
              <div className={`p-8 border-b flex flex-col items-center justify-center text-center relative ${getScoreBg(result.matchScore)}`}>
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">{t('cv_match_score')}</div>
                <div className={`text-6xl md:text-7xl font-black mb-3 ${getScoreColor(result.matchScore)} tabular-nums`}>
                  {result.matchScore}%
                </div>
                <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm border ${getRecommendationStyle(result.recommendation)}`}>
                  {getRecommendationTranslated(result.recommendation)}
                </span>
                
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Trophy className="w-24 h-24" />
                </div>
              </div>

              {/* Analysis body */}
              <div className="p-6 md:p-8 space-y-8 bg-slate-50/50">

                {/* Reasoning */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                  <h4 className="font-black text-slate-800 flex items-center gap-2 mb-3 text-xs uppercase tracking-widest">
                    <FileText className="w-4 h-4 text-indigo-500" /> {t('cv_insights')}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                    "{result.reasoning}"
                  </p>
                </div>

                {/* Optimized Skills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-sm transition-transform hover:scale-[1.02]">
                    <h4 className="font-black text-green-700 flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> {t('cv_matching')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.matchingSkills.length === 0 ? (
                        <span className="text-xs text-slate-400 italic font-medium">{t('cv_none')}</span>
                      ) : result.matchingSkills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-lg border border-green-100">{skill}</span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-red-100 shadow-sm transition-transform hover:scale-[1.02]">
                    <h4 className="font-black text-red-700 flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest">
                      <XCircle className="w-4 h-4" /> {t('cv_missing')}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.missingSkills.length === 0 ? (
                        <span className="text-[11px] text-green-600 font-bold flex items-center gap-1.5 bg-green-50 px-2.5 py-1 rounded-lg">
                          {t('cv_perfect')}
                        </span>
                      ) : result.missingSkills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 text-[11px] font-bold rounded-lg border border-red-100">{skill}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <ArrowRight className="w-4 h-4 text-indigo-500" /> {t('cv_advice')}
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {result.improvementTips.map((tip, i) => (
                      <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-600 transition-colors">
                           <span className="text-[10px] font-black text-indigo-600 group-hover:text-white">{i+1}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* NEW: AI WORKSPACE SECTION */}
                <div className="pt-6 border-t border-slate-200 space-y-4">
                  <h4 className="font-black text-slate-800 flex items-center gap-2 text-xs uppercase tracking-widest">
                    <Sparkles className="w-4 h-4 text-purple-500" /> {t('cv_workspace_title')}
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleRestructure}
                      disabled={isOptimizing}
                      className="flex-1 py-3 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-[11px] uppercase tracking-wide border border-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                      {t('cv_btn_restructure')}
                    </button>
                    <button
                      onClick={handleTailor}
                      disabled={isOptimizing}
                      className="flex-1 py-3 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-bold text-[11px] uppercase tracking-wide border border-purple-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isOptimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {t('cv_btn_tailor')}
                    </button>
                  </div>

                  {generatedResume && (
                    <div className="mt-6 bg-slate-900 rounded-2xl p-5 shadow-inner animate-fade-in relative group/output">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('cv_output_label')}</span>
                        <button
                          onClick={handleCopy}
                          className="p-2 transition-all rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Copy to Clipboard"
                        >
                          {copySuccess ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
                          {generatedResume}
                        </pre>
                      </div>
                      
                      {copySuccess && (
                        <div className="absolute top-12 right-6 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-fade-in">
                          {t('cv_copy_success')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 min-h-[300px] md:min-h-[500px] flex flex-col items-center justify-center text-center p-10 group transition-all hover:bg-slate-50 hover:border-slate-300">
              <div className="bg-white p-6 rounded-full shadow-sm mb-6 transition-transform group-hover:scale-110">
                <Briefcase className="w-12 h-12 text-slate-300 group-hover:text-indigo-400 transition-colors" />
              </div>
              <h3 className="font-black text-slate-700 text-lg mb-2 uppercase tracking-wide">{t('cv_empty_title')}</h3>
              <p className="max-w-xs text-sm text-slate-400 font-medium leading-relaxed">
                {t('cv_empty_subtitle')}
              </p>
            </div>
          )}
        </div>
      </div>

      <HelpGuide 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
        language={language} 
        initialTab="cv" 
      />
    </div>
  );
};

const Trophy = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-2.34" />
    <path d="M12 2v12" />
    <path d="M7 2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1H7z" />
  </svg>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default CvMatcher;
