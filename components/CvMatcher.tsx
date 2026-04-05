import React, { useState } from 'react';
import { UploadCloud, Link as LinkIcon, FileText, CheckCircle2, AlertTriangle, XCircle, Search, ArrowRight, Briefcase } from 'lucide-react';
import { parseResumeFromFile, analyzeCvMatch } from '../services/ai';
import { CvAnalysisResult } from '../types';

const CvMatcher: React.FC = () => {
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState<string>(''); 
  const [jobInputMode, setJobInputMode] = useState<'url' | 'text'>('text');
  const [jobInput, setJobInput] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<CvAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobFromUrl = async (url: string): Promise<string> => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Failed to fetch the URL");
    
    const data = await response.json();
    const htmlContent = data.contents;
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");
    const extractedText = doc.body.innerText || doc.body.textContent || '';
    return extractedText.replace(/\s+/g, ' ').trim();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0]);
      setCvText(''); // reset cached text
      setResult(null); // reset result
    }
  };

  const handleAnalyze = async () => {
    if (!cvFile && !cvText) {
      setError("Please upload your CV/Resume first.");
      return;
    }
    if (!jobInput.trim()) {
      setError("Please provide a Job Post Link or Text.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

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
            throw new Error("Could not extract enough text from the URL. The site might be blocking scrapers. Please switch to 'Paste Text' mode.");
          }
        } catch (e: any) {
          throw new Error(e.message || "Failed to fetch from URL. Try 'Paste Text' mode.");
        }
      }

      const analysisNode = await analyzeCvMatch(parsedCvText, targetJobText);
      setResult(analysisNode);

    } catch (e: any) {
      setError(e.message || "An error occurred during analysis by AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 50) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Briefcase className="w-64 h-64" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold mb-2">AI CV Matcher</h2>
          <p className="text-blue-100 max-w-2xl text-lg">
            Compare your resume against any job description to discover your true match percentage and uncover missing keywords before you apply.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column: Upload & Input */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">1</span>
              Upload Your CV
            </h3>
            
            <label className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-50 transition min-h-[140px]">
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={handleFileChange} />
              {cvFile ? (
                <div className="flex flex-col items-center text-center">
                  <div className="bg-green-100 p-3 rounded-full mb-3">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <span className="font-bold text-slate-700">{cvFile.name}</span>
                  <span className="text-sm text-slate-500">Ready to analyze</span>
                  <button 
                    onClick={(e) => { e.preventDefault(); setCvFile(null); setCvText(''); }}
                    className="mt-2 text-xs text-red-500 hover:underline"
                  >
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center text-slate-500">
                  <UploadCloud className="w-10 h-10 mb-3 text-slate-400" />
                  <span className="font-medium text-slate-700 mb-1">Click to upload CV</span>
                  <span className="text-xs">Supports PDF, DOCX, PNG, JPG</span>
                </div>
              )}
            </label>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
             <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
              <span className="bg-indigo-100 text-indigo-700 w-6 h-6 flex items-center justify-center rounded-full text-xs">2</span>
              Target Job Post
            </h3>

            <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
              <button 
                onClick={() => setJobInputMode('text')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${jobInputMode === 'text' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <div className="flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Paste Text</div>
              </button>
              <button 
                onClick={() => setJobInputMode('url')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${jobInputMode === 'url' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
              >
                 <div className="flex items-center justify-center gap-2"><LinkIcon className="w-4 h-4" /> Paste Link</div>
              </button>
            </div>

            {jobInputMode === 'url' ? (
              <div>
                <input 
                  type="url" 
                  value={jobInput}
                  onChange={e => setJobInput(e.target.value)}
                  placeholder="https://linkedin.com/jobs/view/..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-yellow-500" /> 
                  Some sites block auto-fetching. If it fails, use Paste Text.
                </p>
              </div>
            ) : (
              <textarea 
                value={jobInput}
                onChange={e => setJobInput(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={6}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none text-sm"
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 flex items-start gap-3">
              <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-bold block mb-1">Analysis Failed</span>
                {error}
              </div>
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !cvFile || !jobInput.trim()}
            className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 transition shadow-lg relative overflow-hidden group"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Analyzing CV Matrix...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" /> Calculate Match Rate
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Results */}
        <div className="h-full">
          {result ? (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden h-full flex flex-col animate-scale-in">
              {/* Score Header */}
              <div className={`p-6 border-b flex flex-col items-center justify-center text-center ${getScoreBg(result.matchScore)}`}>
                <div className="text-sm font-bold text-slate-600 uppercase tracking-widest mb-1">Match Rate</div>
                <div className={`text-6xl font-black mb-2 ${getScoreColor(result.matchScore)}`}>
                  {result.matchScore}%
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/60 rounded-full text-sm font-semibold text-slate-800">
                  {result.recommendation}
                </div>
              </div>

              {/* Analysis Content */}
              <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-slate-50">
                
                {/* Reasoning */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-indigo-600" /> Recruiter Insights
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-lg border border-slate-100 shadow-sm">
                    {result.reasoning}
                  </p>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-green-100">
                     <h4 className="font-bold text-green-700 flex items-center gap-2 mb-3 text-sm">
                       <CheckCircle2 className="w-4 h-4" /> Matching Skills
                     </h4>
                     <div className="flex flex-wrap gap-1.5">
                       {result.matchingSkills.length === 0 && <span className="text-xs text-slate-400">None detected</span>}
                       {result.matchingSkills.map((skill, i) => (
                         <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-200">
                           {skill}
                         </span>
                       ))}
                     </div>
                  </div>

                  <div className="bg-white p-4 rounded-lg border border-red-100">
                     <h4 className="font-bold text-red-700 flex items-center gap-2 mb-3 text-sm">
                       <XCircle className="w-4 h-4" /> Missing Keywords
                     </h4>
                     <div className="flex flex-wrap gap-1.5">
                       {result.missingSkills.length === 0 && <span className="text-xs text-slate-400">Perfect match!</span>}
                       {result.missingSkills.map((skill, i) => (
                         <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-md border border-red-200">
                           {skill}
                         </span>
                       ))}
                     </div>
                  </div>
                </div>

                {/* Improvements */}
                <div>
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-3">
                    <ArrowRight className="w-4 h-4 text-indigo-600" /> Actionable Advice
                  </h4>
                  <ul className="space-y-2">
                    {result.improvementTips.map((tip, i) => (
                       <li key={i} className="flex gap-2 text-sm text-slate-600 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                         <span className="font-bold text-indigo-500 mt-0.5">•</span>
                         <span className="leading-relaxed">{tip}</span>
                       </li>
                    ))}
                  </ul>
                </div>

              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl border border-dashed border-slate-300 h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
               <Briefcase className="w-16 h-16 mb-4 text-slate-300 opacity-50" />
               <h3 className="font-bold text-slate-600 text-lg mb-2">Awaiting Analysis</h3>
               <p className="max-w-xs text-sm">Upload your CV and provide a job description on the left to see your match score predicting your success rate.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CvMatcher;
