import React, { useState, useMemo, useRef } from 'react';
import { Platform, SearchStrategy, PositioningSuggestion, Language } from '../types';
import { generateSearchStrategy, generatePositioningSuggestions, parseResumeFromFile } from '../services/ai';
import { Search, Loader2, Target, Copy, Check, MapPin, Users, ChevronDown, Briefcase, ListFilter, Sparkles, UserCircle, ExternalLink, Filter, ArrowRight, Lightbulb, FileText, Upload, AlertTriangle } from 'lucide-react';
import { getTranslation, getFriendlyErrorMessage } from '../utils/i18n';

interface Props {
  onNicheSelect: (niche: string) => void;
  // State lifted from App.tsx
  globalJobTitle: string;
  setGlobalJobTitle: (val: string) => void;
  globalNiche: string;
  setGlobalNiche: (val: string) => void;
  globalBio: string;
  setGlobalBio: (val: string) => void;
  language: Language;
}

// Data Presets
const JOB_PRESETS: Record<string, string[]> = {
  "Web Developer": [
    "E-commerce Store Owners",
    "SaaS Startups (Early Stage)",
    "Real Estate Agencies",
    "Marketing Agencies (White Label)",
    "Local Service Businesses (Dentists, Plumbers)",
    "Course Creators / Coaches"
  ],
  "Graphic Designer": [
    "Coffee Shops & F&B Owners",
    "Fashion & Apparel Brands",
    "YouTubers / Streamers",
    "SaaS Companies",
    "Event Organizers",
    "Skincare / Beauty Brands"
  ],
  "Content Writer / Copywriter": [
    "B2B Tech Companies",
    "Health & Wellness Coaches",
    "Real Estate Agents",
    "Email Marketing Agencies",
    "Financial Advisors",
    "Travel & Tourism Boards"
  ],
  "Social Media Manager": [
    "Restaurants & Cafes",
    "Beauty Salons & Spas",
    "Personal Brands / Influencers",
    "Gyms & Fitness Centers",
    "Boutique Hotels",
    "Interior Designers"
  ],
  "Video Editor": [
    "YouTube Content Creators",
    "Online Course Creators",
    "Wedding Planners",
    "Real Estate Agents (Property Tours)",
    "Podcast Hosts",
    "Corporate HR (Training Videos)"
  ],
  "Virtual Assistant": [
    "Busy C-Level Executives",
    "Small Business Owners",
    "Podcasters (Guest Management)",
    "Real Estate Brokers",
    "Medical Professionals",
    "E-commerce Store Managers"
  ],
  "SEO Specialist": [
    "Local Service Businesses (HVAC, Roofing)",
    "Law Firms / Attorneys",
    "Medical Practices / Clinics",
    "E-commerce Stores",
    "News & Media Outlets"
  ],
  "Digital Marketer / Ads Specialist": [
    "E-commerce Brands (DTC)",
    "Car Dealerships",
    "Dentists / Chiropractors",
    "Event Promoters",
    "Solar / Home Improvement Companies"
  ],
  "UI/UX Designer": [
    "Fintech Startups",
    "Healthcare Apps",
    "E-commerce Platforms",
    "Enterprise Software Companies",
    "Web3 / Crypto Projects"
  ]
};

// RECOMMENDED PLATFORMS MAPPING
const JOB_PLATFORM_RECOMMENDATIONS: Record<string, Platform[]> = {
  "Web Developer": [Platform.GoogleMaps, Platform.LinkedIn],
  "Graphic Designer": [Platform.Instagram, Platform.LinkedIn],
  "Content Writer / Copywriter": [Platform.LinkedIn, Platform.Twitter],
  "Social Media Manager": [Platform.Instagram, Platform.TikTok, Platform.GoogleMaps],
  "Video Editor": [Platform.YouTube, Platform.TikTok, Platform.Instagram],
  "Virtual Assistant": [Platform.LinkedIn, Platform.GoogleMaps],
  "SEO Specialist": [Platform.Google, Platform.LinkedIn],
  "Digital Marketer / Ads Specialist": [Platform.LinkedIn, Platform.Instagram],
  "UI/UX Designer": [Platform.LinkedIn, Platform.Twitter]
};

// NEW: Job Specific Workflows
const JOB_WORKFLOWS: Record<string, Record<string, string[]>> = {
  "Virtual Assistant": {
    "Google Maps": [
      "Find busy clinics/offices with **reviews complaining about 'no one answered the phone'** -> Pitch CS/Admin support.",
      "Look for businesses using **Gmail/Yahoo** emails instead of domain emails -> Pitch inbox management.",
      "Target businesses with 'Appointment required' but **no booking link** -> Pitch setting up Calendly/Booking systems."
    ],
    "LinkedIn": [
      "Search for CEOs posting about **'overwhelmed', 'hiring', 'busy'**.",
      "Look for Solopreneurs who post content inconsistently -> Pitch content scheduling/admin.",
      "Filter by 'Hiring' for roles like 'Executive Assistant' -> Pitch your contract services instead."
    ]
  },
  "Web Developer": {
    "Google Maps": [
      "Look for businesses with **'Website: Add website'** (missing website) -> Pitch building their first site.",
      "Click their website link. If it says **'Not Secure'** or looks broken on mobile -> Perfect lead.",
      "Check 'Claim this business'. If unclaimed, they likely have zero digital presence."
    ],
    "Google": [
      "Use `site:.com 'copyright 2020'` to find outdated websites.",
      "Search for `inurl:admin` or broken WP logins to find unsecured sites."
    ]
  },
  "Graphic Designer": {
    "Google Maps": [
      "Look for **'Menu' photos that are just blurry PDFs** or photos of paper menus -> Pitch digital menu design.",
      "Check their logo on Maps. Is it pixelated? Cropped wrong? -> Pitch rebranding.",
      "Look for businesses with great reviews but **terrible signage/branding** photos."
    ],
    "Instagram": [
      "Find brands using **Canva templates that look generic**.",
      "Look for inconsistent color palettes in their feed grid."
    ]
  },
  "Social Media Manager": {
    "Google Maps": [
      "Check 'Latest updates'. If the **last post was 6 months ago** -> They need you.",
      "Look for reviews saying 'I didn't know they were open' -> They need awareness.",
      "Check if they are using stock photos on their Maps profile."
    ],
    "Instagram": [
      "Look for accounts with high follower count but **zero engagement** (dead audience).",
      "Find businesses posting 'We are hiring' flyers as feed posts (ugly)."
    ]
  },
  "Video Editor": {
    "YouTube": [
      "Find channels with good content/views but **bad thumbnails** or **poor audio**.",
      "Look for podcasts that post full episodes but **no Shorts/Clips** -> Pitch repurposing.",
      "Find streamers with long VODs -> Pitch highlight editing."
    ],
    "TikTok": [
      "Find brands posting 'Slideshows' instead of real video -> Pitch video creation."
    ]
  }
};

const StrategyGenerator: React.FC<Props> = ({ 
  onNicheSelect, 
  globalJobTitle, setGlobalJobTitle,
  globalNiche, setGlobalNiche,
  globalBio, setGlobalBio,
  language
}) => {
  // Local state for non-persisted form elements
  const [customJobTitle, setCustomJobTitle] = useState('');
  
  const [platform, setPlatform] = useState<Platform>(Platform.Google);
  const [location, setLocation] = useState('');
  
  const [idealClient, setIdealClient] = useState('');
  const [customIdealClient, setCustomIdealClient] = useState('');
  
  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isParsingCV, setIsParsingCV] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Data States
  const [strategy, setStrategy] = useState<SearchStrategy | null>(null);
  const [bioSuggestions, setBioSuggestions] = useState<PositioningSuggestion[]>([]);
  
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const cvInputRef = useRef<HTMLInputElement>(null);

  // Derived Values
  const isCustomJob = globalJobTitle === 'Other';
  const isCustomClient = idealClient === 'Other';
  const activeJob = isCustomJob ? customJobTitle : globalJobTitle;
  const t = (key: any) => getTranslation(language, key);
  
  // Get persona options based on selected job
  const personaOptions = useMemo(() => {
    return JOB_PRESETS[globalJobTitle] || [];
  }, [globalJobTitle]);

  // Get recommended platforms based on selected job
  const recommendedPlatforms = useMemo(() => {
    if (!activeJob) return [];
    return JOB_PLATFORM_RECOMMENDATIONS[activeJob] || [];
  }, [activeJob]);

  const handleGenerate = async () => {
    const finalJob = isCustomJob ? customJobTitle : globalJobTitle;
    const finalClient = isCustomClient ? customIdealClient : idealClient;

    if (!finalJob) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await generateSearchStrategy(
        finalJob, 
        platform, 
        globalNiche, 
        location, 
        finalClient,
        globalBio // Pass the bio for better context
      );
      setStrategy(result);
    } catch (e: any) {
      console.error(e);
      const friendlyMsg = getFriendlyErrorMessage(e, language);
      setErrorMsg(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateBio = async () => {
    const finalJob = isCustomJob ? customJobTitle : globalJobTitle;
    if (!finalJob) {
      alert("Please select a Job Title first.");
      return;
    }
    
    setIsGeneratingBio(true);
    setErrorMsg(null);
    setBioSuggestions([]);
    try {
      const suggestions = await generatePositioningSuggestions(finalJob, globalNiche);
      setBioSuggestions(suggestions);
    } catch(e: any) {
      console.error(e);
      const friendlyMsg = getFriendlyErrorMessage(e, language);
      alert(friendlyMsg); 
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingCV(true);
    setErrorMsg(null);
    try {
      const summary = await parseResumeFromFile(file);
      setGlobalBio(summary);
    } catch (err: any) {
      const friendlyMsg = getFriendlyErrorMessage(err, language);
      alert(friendlyMsg);
      console.error(err);
    } finally {
      setIsParsingCV(false);
      // Clear input so same file can be selected again
      if (cvInputRef.current) cvInputRef.current.value = '';
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllKeywords = () => {
    if (!strategy) return;
    const allText = strategy.keywords.join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const getSearchUrl = (plat: Platform, keyword: string) => {
    const encoded = encodeURIComponent(keyword);
    switch (plat) {
      case Platform.Google:
        return `https://www.google.com/search?q=${encoded}`;
      case Platform.GoogleMaps:
        return `https://www.google.com/maps/search/${encoded}`;
      case Platform.LinkedIn:
        return `https://www.linkedin.com/search/results/all/?keywords=${encoded}&origin=GLOBAL_SEARCH_HEADER`;
      case Platform.Twitter:
        return `https://twitter.com/search?q=${encoded}&f=live`; // Force "Latest" tab
      case Platform.Instagram:
        // Use Keyword search instead of Tags to find accounts/businesses
        return `https://www.instagram.com/explore/search/keyword/?q=${encoded}`;
      case Platform.TikTok:
        return `https://www.tiktok.com/search?q=${encoded}`;
      case Platform.YouTube:
        return `https://www.youtube.com/results?search_query=${encoded}`;
      default:
        return `https://www.google.com/search?q=${encoded}`;
    }
  };

  const getWorkflowSteps = (job: string, plat: Platform): string[] => {
    // 1. Try to find specific job+platform match
    if (JOB_WORKFLOWS[job]) {
      // Check exact platform match
      if (JOB_WORKFLOWS[job][plat]) return JOB_WORKFLOWS[job][plat];
      // Check vague match (e.g. Google Maps/Google might share logic if not strict)
      if (plat === Platform.GoogleMaps && JOB_WORKFLOWS[job]['Google Maps']) return JOB_WORKFLOWS[job]['Google Maps'];
    }

    // 2. Fallback Generic Defaults if no specific guide exists
    switch (plat) {
      case Platform.GoogleMaps:
        return [
          "Look for businesses with **Low Ratings (3-4 stars)**.",
          "Check if they have 'Claim this business' (inactive).",
          "Visit their website. If it's broken or old -> **Perfect Lead.**"
        ];
      case Platform.LinkedIn:
        return [
          "Filter by **'Posts'** -> **'Past 24 hours'**.",
          "Engage/Comment first before connecting.",
          "Look for 'Hiring' or 'Help needed' in posts."
        ];
      case Platform.Instagram:
        return [
          "Don't just look at photos. **Read their Bio.** Does it look professional?",
          "Click the link in bio. Is it a broken Linktree? Do they have a website?",
          "Check their 'Tagged' photos. Are real customers tagging them? (Social Proof)."
        ];
      case Platform.YouTube:
         return [
           "Filter by **Upload Date: This Week** to find active creators.",
           "Check the 'About' tab for business emails.",
           "Look for channels with high views but low sub count (viral potential but needs branding)."
         ];
      default:
        return [
          "Use the keywords below to find recent activity.",
          "Look for dissatisfaction or questions in comments.",
          "Check profile links for missing websites/portfolios."
        ];
    }
  };

  const PlatformGuide = () => {
    const steps = getWorkflowSteps(activeJob, platform);

    // Color logic
    let colorClass = "bg-slate-50 border-slate-200 text-slate-800";
    let icon = <Filter className="w-4 h-4" />;
    
    if (platform === Platform.LinkedIn) { colorClass = "bg-blue-50 border-blue-100 text-blue-800"; }
    else if (platform === Platform.GoogleMaps) { colorClass = "bg-green-50 border-green-100 text-green-800"; icon = <MapPin className="w-4 h-4" />; }
    else if (platform === Platform.Google) { colorClass = "bg-orange-50 border-orange-100 text-orange-800"; }
    else if (platform === Platform.YouTube) { colorClass = "bg-red-50 border-red-100 text-red-800"; }
    else if (platform === Platform.Instagram) { colorClass = "bg-pink-50 border-pink-100 text-pink-800"; }

    return (
      <div className={`border rounded-lg p-4 mb-4 ${colorClass}`}>
        <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
          {icon} 
          {activeJob ? `Pro Workflow: ${activeJob} on ${platform}` : `Professional Workflow: ${platform}`}
        </h4>
        <ol className="list-decimal list-inside text-sm opacity-90 space-y-1.5">
          {steps.map((step, i) => (
             <li key={i} dangerouslySetInnerHTML={{ __html: step.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Input Section - Switched bg-white to bg-slate-50 */}
      <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-slate-700" />
          {t('strat_title')}
        </h2>
        
        {errorMsg && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm flex items-start gap-3 shadow-sm animate-fade-in">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">Generation Failed</p>
              <p className="mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* JOB TITLE INPUT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> {t('strat_role')}
            </label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none bg-slate-50 focus:bg-slate-100 appearance-none cursor-pointer text-slate-800"
                value={globalJobTitle}
                onChange={(e) => {
                  setGlobalJobTitle(e.target.value);
                  setIdealClient(''); // Reset client when job changes
                }}
              >
                <option value="" disabled>Select your role</option>
                {Object.keys(JOB_PRESETS).map((job) => (
                  <option key={job} value={job} className="bg-slate-50 text-slate-800">{job}</option>
                ))}
                <option value="Other" className="bg-slate-50 text-slate-800 font-semibold">Other (Type manually)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
            
            {/* Custom Job Input if 'Other' is selected */}
            {isCustomJob && (
              <input
                type="text"
                className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition bg-slate-50 focus:bg-slate-100 text-slate-800 animate-fade-in"
                placeholder="Type your specific job title..."
                value={customJobTitle}
                onChange={(e) => setCustomJobTitle(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* PLATFORM INPUT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('strat_platform')}</label>
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none bg-slate-50 focus:bg-slate-100 appearance-none cursor-pointer text-slate-800"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                {Object.values(Platform).map((p) => (
                  <option key={p} value={p} className="bg-slate-50 text-slate-800">{p}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

            {/* Platform Recommendations (Smart Chips) */}
            {recommendedPlatforms.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 animate-fade-in">
                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-amber-500" /> Best for you:
                </span>
                {recommendedPlatforms.map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`text-[10px] font-medium px-2 py-1 rounded-full border transition-all active:scale-95 ${
                      platform === p 
                        ? 'bg-slate-800 text-slate-50 border-slate-800 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LOCATION INPUT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {t('strat_location')}
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition bg-slate-50 focus:bg-slate-100 text-slate-800"
              placeholder="e.g. Jakarta, US, Worldwide"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* IDEAL CLIENT PERSONA INPUT */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> {t('strat_client')}
            </label>
            
            <div className="relative">
              <select
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none bg-slate-50 focus:bg-slate-100 appearance-none cursor-pointer text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                value={idealClient}
                onChange={(e) => setIdealClient(e.target.value)}
                disabled={!globalJobTitle && !isCustomJob}
              >
                <option value="" disabled>
                  {!globalJobTitle ? "Select a job first" : "Select who you want to serve"}
                </option>
                
                {personaOptions.map((persona, idx) => (
                  <option key={idx} value={persona} className="bg-slate-50 text-slate-800">{persona}</option>
                ))}
                
                <option value="Other" className="bg-slate-50 text-slate-800 font-semibold">Other (Type manually)</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>

             {/* Custom Client Input if 'Other' is selected */}
             {isCustomClient && (
              <input
                type="text"
                className="mt-2 w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition bg-slate-50 focus:bg-slate-100 text-slate-800 animate-fade-in"
                placeholder="Type your ideal client persona..."
                value={customIdealClient}
                onChange={(e) => setCustomIdealClient(e.target.value)}
                autoFocus
              />
            )}
          </div>

          {/* NICHE INPUT */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t('strat_niche')} <span className="text-slate-400 font-normal">(Optional - AI will suggest if empty)</span>
            </label>
            <input
              type="text"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition bg-slate-50 focus:bg-slate-100 text-slate-800"
              placeholder="e.g. Sustainable Fashion, SaaS Startups"
              value={globalNiche}
              onChange={(e) => setGlobalNiche(e.target.value)}
            />
          </div>

          {/* BIO / POSITIONING SECTION (UPDATED) */}
          <div className="md:col-span-2 border-t border-slate-100 pt-4 mt-2">
            <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
               <label className="block text-sm font-medium text-slate-700 flex items-center gap-1">
                <UserCircle className="w-4 h-4" /> 
                {t('strat_bio')}
                <span className="text-slate-400 font-normal ml-1">{t('strat_bio_hint')}</span>
              </label>
              
              <div className="flex items-center gap-2">
                 <input 
                   type="file" 
                   accept="image/*,application/pdf,.doc,.docx" 
                   ref={cvInputRef} 
                   className="hidden" 
                   onChange={handleCVUpload}
                 />
                 <button
                  onClick={() => cvInputRef.current?.click()}
                  disabled={isParsingCV}
                  className="text-xs flex items-center gap-1 text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition border border-blue-200"
                  title="Upload PDF, JPG, or DOCX"
                >
                  {isParsingCV ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isParsingCV ? "Reading File..." : t('strat_btn_import')}
                </button>

                <button
                  onClick={handleGenerateBio}
                  disabled={isGeneratingBio || (!globalJobTitle && !customJobTitle)}
                  className="text-xs flex items-center gap-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition disabled:opacity-50 border border-slate-200"
                >
                  {isGeneratingBio ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isGeneratingBio ? "Generating..." : t('strat_btn_suggest')}
                </button>
              </div>
            </div>
            
            {/* Suggestions Display */}
            {bioSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 animate-fade-in">
                {bioSuggestions.map((suggestion, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setGlobalBio(suggestion.statement)}
                    className="p-3 bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer transition group"
                  >
                    <p className="text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      {suggestion.type}
                      <Check className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </p>
                    <p className="text-xs text-slate-600 leading-snug italic mb-2">"{suggestion.statement}"</p>
                    <p className="text-[10px] text-slate-400">{suggestion.explanation}</p>
                  </div>
                ))}
              </div>
            )}

            <textarea
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition bg-slate-50 focus:bg-slate-100 text-slate-800 min-h-[120px] text-sm leading-relaxed"
              placeholder="Paste your Resume Summary here, or describe your experience and skills in detail. This helps the AI match you with the right leads."
              value={globalBio}
              onChange={(e) => setGlobalBio(e.target.value)}
            />
            <p className="text-[10px] text-slate-400 mt-1 text-right">
               {globalBio.length > 0 ? `${globalBio.length} chars` : "Detailed inputs give better AI results."}
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || (!globalJobTitle && !customJobTitle)}
          className="mt-6 w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-slate-50 font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform active:scale-[0.99]"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          {t('strat_btn_generate')}
        </button>
      </div>

      {/* Results Section */}
      {strategy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          
          {/* Niche Suggestions - Switched bg-white to bg-slate-50 */}
          <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Recommended Niches</h3>
            <div className="space-y-3">
              {strategy.nicheSuggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setGlobalNiche(s);
                    onNicheSelect(s);
                  }}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg transition text-sm font-medium border border-slate-200 flex justify-between group"
                >
                  {s}
                  <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
              {strategy.nicheSuggestions.length === 0 && <p className="text-slate-500 italic">No generic suggestions needed.</p>}
            </div>

            {/* AI Tips Section moved here */}
            <div className="mt-8 pt-6 border-t border-slate-100">
               <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                 <Lightbulb className="w-4 h-4 text-purple-600" />
                 {t('strat_results_tips')} (for {globalJobTitle || customJobTitle})
               </h3>
               <ul className="space-y-3 text-xs text-slate-600">
                {strategy.tips.map((tip, i) => (
                  <li key={i} className="flex gap-2 leading-relaxed">
                     <span className="text-slate-300">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Keywords & Workflow - Switched bg-white to bg-slate-50 */}
          <div className="bg-slate-50 p-6 rounded-xl shadow-sm border border-slate-200 row-span-2 flex flex-col h-[600px]">
            <div className="flex justify-between items-center mb-4">
              <div>
                 <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                   <ListFilter className="w-5 h-5 text-slate-600" />
                   {t('strat_results_keywords')} ({strategy.keywords.length})
                 </h3>
                 <p className="text-xs text-slate-500">Actionable queries for {platform}.</p>
              </div>
              <button
                onClick={copyAllKeywords}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                Copy List
              </button>
            </div>
            
            {/* Dynamic Guide based on Platform */}
            <PlatformGuide />

            {/* Scrollable Container for many keywords */}
            <div className="space-y-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
              {strategy.keywords.map((k, i) => (
                <div key={i} className="flex items-center gap-2 group p-1 hover:bg-slate-100 rounded-lg transition-colors">
                  <div className="flex-1 min-w-0">
                    <code className="block text-slate-700 text-sm font-mono truncate" title={k}>
                      {k}
                    </code>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-100 md:opacity-60 md:group-hover:opacity-100 transition-opacity">
                     <button
                        onClick={() => copyToClipboard(k, i)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition"
                        title="Copy"
                      >
                        {copiedIndex === i ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>

                      <a 
                        href={getSearchUrl(platform, k)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-slate-50 rounded text-xs font-medium transition ml-1"
                        title={`Open in ${platform}`}
                      >
                         Search <ExternalLink className="w-3 h-3" />
                      </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrategyGenerator;