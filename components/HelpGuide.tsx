import React, { useState } from 'react';
import { X, ChevronRight, MessageSquare, Target, Zap, FileText, Search, Sparkles, CheckCircle2 } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../utils/i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  initialTab?: 'leads' | 'cv';
}

const HelpGuide: React.FC<Props> = ({ isOpen, onClose, language, initialTab = 'leads' }) => {
  const [activeTab, setActiveTab] = useState<'leads' | 'cv'>(initialTab);
  const t = (key: any) => getTranslation(language, key);

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const LeadSteps = [
    { title: t('guide_leads_step1_title'), desc: t('guide_leads_step1_desc'), icon: Zap, color: 'text-blue-500' },
    { title: t('guide_leads_step2_title'), desc: t('guide_leads_step2_desc'), icon: Target, color: 'text-purple-500' },
    { title: t('guide_leads_step3_title'), desc: t('guide_leads_step3_desc'), icon: MessageSquare, color: 'text-amber-500' },
    { title: t('guide_leads_step4_title'), desc: t('guide_leads_step4_desc'), icon: CheckCircle2, color: 'text-green-500' },
  ];

  const CvSteps = [
    { title: t('guide_cv_step1_title'), desc: t('guide_cv_step1_desc'), icon: FileText, color: 'text-indigo-500' },
    { title: t('guide_cv_step2_title'), desc: t('guide_cv_step2_desc'), icon: Search, color: 'text-slate-500' },
    { title: t('guide_cv_step3_title'), desc: t('guide_cv_step3_desc'), icon: Target, color: 'text-amber-500' },
    { title: t('guide_cv_step4_title'), desc: t('guide_cv_step4_desc'), icon: Sparkles, color: 'text-purple-500' },
  ];

  const currentSteps = activeTab === 'leads' ? LeadSteps : CvSteps;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row max-h-[85vh]">
        
        {/* Sidebar / Tabs */}
        <div className="w-full md:w-64 bg-slate-50 p-6 md:border-r border-slate-200">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">{t('guide_title')}</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{t('guide_subtitle')}</p>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('leads')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'leads' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('guide_leads_tab')}
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'leads' ? 'rotate-90 md:rotate-0' : ''}`} />
            </button>
            <button
              onClick={() => setActiveTab('cv')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'cv' ? 'bg-white shadow-sm text-slate-900 border border-slate-200' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('guide_cv_tab')}
              <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'cv' ? 'rotate-90 md:rotate-0' : ''}`} />
            </button>
          </nav>

          <div className="mt-auto hidden md:block pt-10">
             <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest mb-1">Pro Tip</p>
                <p className="text-[11px] text-indigo-600 leading-relaxed italic">
                   {language === 'id' 
                     ? "Gunakan Bio/Resume di tab 'Cari Klien' agar AI bisa menganalisis profil Anda dengan tepat!"
                     : "Fill your Bio/Resume in 'Find Clients' for the most accurate AI analysis!"}
                </p>
             </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col relative bg-white overflow-hidden">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="space-y-8">
              {currentSteps.map((step, index) => (
                <div key={index} className="flex gap-5 animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 ${step.color}`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-1">{step.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed font-medium">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-center">
               <button
                 onClick={onClose}
                 className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold shadow-lg transition active:scale-95 text-sm"
               >
                 {language === 'id' ? "Saya Mengerti" : "Got it, thanks!"}
               </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HelpGuide;
