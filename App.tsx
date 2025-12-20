import React, { useState, useEffect } from 'react';
import StrategyGenerator from './components/StrategyGenerator';
import LeadManager from './components/LeadManager';
import Dashboard from './components/Dashboard';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import ProfileSettings from './components/ProfileSettings';
import Community from './components/Community';
import { LayoutDashboard, Search, Users, Sparkles, LogOut, Shield, Coffee, AlertTriangle, Loader2, UserCircle, MessageSquare, Phone, Instagram, Linkedin, Megaphone, AlertCircle, Menu, X, Moon, Sun, Heart, Globe } from 'lucide-react';
import { getCurrentUser, logout, getConfig } from './services/auth';
import { User, AppConfig, Theme, Language } from './types';
import { getTranslation } from './utils/i18n';
import { supabase } from './services/supabase';

// Color Palettes Definition
const THEMES = {
  light: {
    '--slate-50': '#ffffff', 
    '--slate-100': '#f1f5f9',
    '--slate-200': '#e2e8f0',
    '--slate-300': '#cbd5e1',
    '--slate-400': '#94a3b8',
    '--slate-500': '#64748b',
    '--slate-600': '#475569',
    '--slate-700': '#334155',
    '--slate-800': '#1e293b',
    '--slate-900': '#0f172a',
    '--slate-950': '#020617',
  },
  pink: {
    '--slate-50': '#fff1f2', 
    '--slate-100': '#ffe4e6', 
    '--slate-200': '#fecdd3', 
    '--slate-300': '#fda4af', 
    '--slate-400': '#fb7185', 
    '--slate-500': '#f43f5e', 
    '--slate-600': '#e11d48', 
    '--slate-700': '#be123c', 
    '--slate-800': '#9f1239', 
    '--slate-900': '#881337', 
    '--slate-950': '#4c0519', 
  },
  dark: {
    '--slate-50': '#1e293b', 
    '--slate-100': '#0f172a',
    '--slate-200': '#334155',
    '--slate-300': '#475569',
    '--slate-400': '#64748b',
    '--slate-500': '#94a3b8',
    '--slate-600': '#cbd5e1',
    '--slate-700': '#e2e8f0',
    '--slate-800': '#f1f5f9',
    '--slate-900': '#f8fafc',
    '--slate-950': '#ffffff',
  }
};

const LoveBubbles = () => {
  const [bubbles, setBubbles] = useState<{id: number, left: number, delay: number, size: number}[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const id = Date.now();
      setBubbles(prev => {
        const newBubble = {
          id,
          left: Math.random() * 100, 
          delay: 0,
          size: Math.random() * 1.5 + 0.5 
        };
        const cleanup = prev.filter(b => Date.now() - b.id < 8000); 
        return [...cleanup, newBubble];
      });
    }, 800); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="love-bubble-container">
      {bubbles.map(b => (
        <div 
          key={b.id} 
          className="love-bubble text-pink-400/50" 
          style={{ 
            left: `${b.left}%`, 
            animationDuration: `${5 + Math.random() * 5}s`,
            transform: `scale(${b.size})`
          }}
        >
          {Math.random() > 0.5 ? '❤️' : '💖'}
        </div>
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'strategy' | 'leads' | 'community' | 'admin' | 'profile'>('strategy');
  const [config, setConfig] = useState<AppConfig>({ donationLink: '', appName: 'Avrina LeadScout' });
  const [isRecovering, setIsRecovering] = useState(false);
  
  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [language, setLanguage] = useState<Language>('en');

  // Shared state that moves between tabs
  const [jobTitle, setJobTitle] = useState('');
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    initApp();

    // Listen for PASSWORD_RECOVERY event globally
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    // Load theme
    const savedTheme = localStorage.getItem('leadscout_theme') as Theme;
    if (savedTheme && THEMES[savedTheme]) {
      changeTheme(savedTheme);
    } else {
      changeTheme('light');
    }
    // Load Language
    const savedLang = localStorage.getItem('leadscout_lang') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Effect to update Favicon based on Config Logo
  useEffect(() => {
    if (config.appLogo) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = config.appLogo;
    }
  }, [config.appLogo]);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('leadscout_theme', newTheme);
    
    // Apply CSS variables to root
    const root = document.documentElement;
    // Set Data Attribute for CSS targeting (Glassmorphism)
    root.setAttribute('data-theme', newTheme);

    const colors = THEMES[newTheme];
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  };

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('leadscout_lang', lang);
  };

  const t = (key: any) => getTranslation(language, key);

  const initApp = async () => {
    setLoadingAuth(true);
    const currentUser = await getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setJobTitle(currentUser.jobTitle || '');
      setNiche(currentUser.niche || '');
      setBio(currentUser.bio || '');
    }
    const appConfig = await getConfig();
    setConfig(appConfig);
    setLoadingAuth(false);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setJobTitle('');
    setNiche('');
    setBio('');
    setIsRecovering(false);
    setActiveTab('strategy');
  };

  const handleNicheSelect = (newNiche: string) => {
    setNiche(newNiche);
  };

  const handleProfileUpdate = (data: { jobTitle: string; niche: string; bio: string }) => {
    setJobTitle(data.jobTitle);
    setNiche(data.niche);
    setBio(data.bio);
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const handleConfigUpdate = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const openDonation = () => {
    if (config.donationLink) {
      window.open(config.donationLink, '_blank');
    } else {
      alert("Donation link not configured by admin.");
    }
  };

  const openReportIssue = () => {
    if (config.adminWhatsapp) {
      const phone = config.adminWhatsapp.replace(/\D/g, '');
      const text = encodeURIComponent(`Hello Admin, I have an issue/question regarding ${config.appName || 'LeadScout'}.`);
      window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
    } else {
      window.open('mailto:support@avrina.com?subject=Issue Report', '_blank');
    }
  };

  // Nav Item Helper
  const NavItem = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setSidebarOpen(false); // Close sidebar on mobile when clicked
      }}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
        activeTab === id 
          ? 'bg-slate-100 text-slate-900 border border-slate-200' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  if (loadingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;
  }

  // Force show AuthScreen if in Recovery mode OR no user
  if (!user || isRecovering) {
    return (
      <AuthScreen 
        config={config} 
        language={language} 
        setLanguage={changeLanguage} 
        forceUpdatePassword={isRecovering}
        onAuthSuccess={(u) => {
          setUser(u);
          setJobTitle(u.jobTitle || '');
          setNiche(u.niche || '');
          setBio(u.bio || '');
          setIsRecovering(false); // Clear recovery mode on success
        }} 
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-100 overflow-hidden transition-colors duration-300 relative">
      
      {theme === 'pink' && <LoveBubbles />}

      {/* Guest Warning Banner */}
      {user.role === 'guest' && (
        <div className="bg-orange-100 text-orange-800 px-4 py-2 text-xs font-medium flex-shrink-0 flex items-center justify-center gap-2 border-b border-orange-200 relative z-10">
          <AlertTriangle className="w-3 h-3" />
          {t('guest_warning')}
        </div>
      )}

      {/* MOBILE HEADER */}
      <div className="md:hidden bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center z-20 flex-shrink-0">
         <div className="flex items-center gap-2">
            {config.appLogo ? (
              <img src={config.appLogo} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-600" />
            )}
            <h1 className="font-bold text-slate-800">{config.appName || 'Avrina LeadScout'}</h1>
         </div>
         <button 
           onClick={() => setSidebarOpen(true)}
           className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
         >
           <Menu className="w-6 h-6" />
         </button>
      </div>

      {/* Main Layout Container */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative z-30">
        
        {/* BACKDROP FOR MOBILE */}
        {sidebarOpen && (
           <div 
             className="fixed inset-0 bg-slate-900/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
             onClick={() => setSidebarOpen(false)}
           />
        )}

        {/* SIDEBAR NAVIGATION */}
        <aside 
          className={`
            fixed inset-0 z-50 w-full bg-slate-50 flex flex-col
            transform transition-transform duration-300 ease-in-out
            md:static md:w-64 md:inset-auto md:border-r md:border-slate-200 md:translate-x-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="p-6 pb-2 flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                {config.appLogo ? (
                  <img src={config.appLogo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                )}
                {config.appName || 'Avrina LeadScout'}
              </h1>

              {config.dedicationMessage && (
                <div className="mt-3 mb-2 animate-fade-in">
                  <p className="text-[10px] text-slate-500 italic leading-relaxed border-l-2 border-indigo-200 pl-2">
                    "{config.dedicationMessage}"
                  </p>
                  {config.signature && (
                    <p className="text-[9px] text-slate-400 font-medium mt-1.5 pl-2 opacity-80">
                      App created by {config.signature}
                    </p>
                  )}
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Info & Theme Toggle & Language Toggle */}
          <div className="px-6 mb-4 flex flex-col gap-2">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-xs text-slate-500 font-medium">Hello, {user.name.split(' ')[0]}</p>
                   {user.role === 'admin' && <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">ADMIN</span>}
                </div>
                
                {/* Theme Switcher Mini */}
                <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                  <button 
                    onClick={() => changeTheme('light')}
                    className={`p-1 rounded ${theme === 'light' ? 'bg-slate-50 shadow-sm text-yellow-500' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Light Mode"
                  >
                    <Sun className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => changeTheme('dark')}
                    className={`p-1 rounded ${theme === 'dark' ? 'bg-slate-700 shadow-sm text-indigo-200' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Dark Mode"
                  >
                    <Moon className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => changeTheme('pink')}
                    className={`p-1 rounded ${theme === 'pink' ? 'bg-slate-50 shadow-sm text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}
                    title="Pink Mode"
                  >
                    <Heart className="w-3 h-3" />
                  </button>
                </div>
             </div>

             {/* Language Switcher */}
             <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                   <Globe className="w-3.5 h-3.5" /> Language
                </div>
                <div className="flex items-center gap-1">
                   <button 
                     onClick={() => changeLanguage('en')}
                     className={`text-[10px] font-bold px-2 py-0.5 rounded ${language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                   >
                     EN
                   </button>
                   <button 
                     onClick={() => changeLanguage('id')}
                     className={`text-[10px] font-bold px-2 py-0.5 rounded ${language === 'id' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                   >
                     ID
                   </button>
                </div>
             </div>
          </div>
          
          <nav className="px-3 space-y-1 flex-1 overflow-y-auto">
             <NavItem id="strategy" label={t('nav_strategy')} icon={Search} />
             <NavItem id="leads" label={t('nav_leads')} icon={Users} />
             <NavItem id="dashboard" label={t('nav_dashboard')} icon={LayoutDashboard} />
             <NavItem id="community" label={t('nav_community')} icon={MessageSquare} />

            {user.role !== 'guest' && (
              <div className="my-2 border-t border-slate-100 pt-2">
                <NavItem id="profile" label={t('nav_profile')} icon={UserCircle} />
              </div>
            )}

            {user.role === 'admin' && (
              <button
                onClick={() => { setActiveTab('admin'); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors mt-4 ${
                  activeTab === 'admin' 
                    ? 'bg-purple-50 text-purple-900 border border-purple-200' 
                    : 'text-purple-600 hover:bg-purple-50'
                }`}
              >
                <Shield className="w-5 h-5" />
                {t('nav_admin')}
              </button>
            )}
          </nav>

          <div className="p-3 mt-auto space-y-2 border-t border-slate-100 bg-slate-50/50">
             {config.announcementText && (
              <div className="mb-3 p-3 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl text-white shadow-sm relative overflow-hidden group animate-fade-in">
                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-white/10 w-12 h-12 rounded-full blur-xl"></div>
                <div className="flex flex-col gap-3 relative z-10">
                  <div className="flex items-start gap-2">
                    <Megaphone className="w-3.5 h-3.5 mt-0.5 animate-pulse shrink-0 text-yellow-300" />
                    <p className="text-[10px] font-medium leading-relaxed opacity-95">{config.announcementText}</p>
                  </div>
                </div>
              </div>
             )}

             <div className="space-y-2">
                <button
                 onClick={openReportIssue}
                 className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-sm font-medium transition"
               >
                 <AlertCircle className="w-4 h-4" />
                 {t('btn_report')}
               </button>

                {config.donationLink && (
                  <button
                    onClick={openDonation}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 rounded-lg text-sm font-bold transition shadow-sm"
                  >
                    <Coffee className="w-4 h-4" />
                    {t('btn_donate')}
                  </button>
                )}

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition"
                >
                  <LogOut className="w-4 h-4" />
                  {t('btn_signout')}
                </button>
             </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-0 overflow-y-auto bg-transparent relative z-0">
          <div className="max-w-5xl mx-auto p-4 md:p-8 pb-10">
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Performance Overview</h2>
                <Dashboard />
              </div>
            )}

            {activeTab === 'profile' && user && user.role !== 'guest' && (
              <ProfileSettings user={user} onProfileUpdate={handleProfileUpdate} language={language} />
            )}

            {activeTab === 'strategy' && (
              <div className="animate-fade-in">
                 <StrategyGenerator 
                   onNicheSelect={handleNicheSelect} 
                   globalJobTitle={jobTitle}
                   setGlobalJobTitle={setJobTitle}
                   globalNiche={niche}
                   setGlobalNiche={setNiche}
                   globalBio={bio}
                   setGlobalBio={setBio}
                   language={language}
                 />
              </div>
            )}

            {activeTab === 'leads' && (
              <div className="animate-fade-in">
                <LeadManager userJob={jobTitle} userNiche={niche} userBio={bio} language={language} />
              </div>
            )}

            {activeTab === 'community' && user && (
               <Community user={user} onRegisterClick={handleLogout} />
            )}

            {activeTab === 'admin' && user.role === 'admin' && (
              <AdminDashboard onConfigUpdate={handleConfigUpdate} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;