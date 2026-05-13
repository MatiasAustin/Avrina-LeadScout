import React, { useEffect } from 'react';
import { Sparkles, Target, Zap, Shield, Globe, Users, ArrowRight, MessageSquare, Briefcase, BarChart3, CheckCircle2, TrendingUp, Search, MousePointer2 } from 'lucide-react';
import { AppConfig } from '../types';
import { trackVisitor } from '../services/stats';

interface Props {
  config: AppConfig;
  onGetStarted: () => void;
  onViewBlog: () => void;
}

const LandingPage: React.FC<Props> = ({ config, onGetStarted, onViewBlog }) => {
  
  useEffect(() => {
    trackVisitor('landing_page');
  }, []);

  const features = [
    {
      icon: <Search className="w-6 h-6 text-blue-500" />,
      title: "AI-Powered Lead Discovery",
      description: "Automatically find high-potential clients across LinkedIn, Google Maps, and Instagram using advanced AI filtering."
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-500" />,
      title: "Intelligent Outreach",
      description: "Generate personalized, high-converting outreach scripts tailored to each lead's specific pain points and your unique bio."
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-emerald-500" />,
      title: "Productivity Tracking",
      description: "Set daily targets and track your progress with detailed statistics on leads won and revenue generated."
    },
    {
      icon: <Shield className="w-6 h-6 text-purple-500" />,
      title: "Manual Control",
      description: "Complete control over your database. Add leads manually, track their status, and manage your pipeline even without AI."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-100">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.appLogo ? (
              <img src={config.appLogo} alt="Logo" className="w-8 h-8 object-contain" />
            ) : (
              <Sparkles className="w-6 h-6 text-indigo-600" />
            )}
            <span className="text-xl font-bold tracking-tight text-slate-800">{config.appName || 'Avrina LeadScout'}</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition">How it Works</a>
            <button onClick={onViewBlog} className="hover:text-indigo-600 transition">Blog</button>
            <button 
              onClick={onGetStarted}
              className="bg-slate-900 text-white px-5 py-2 rounded-full hover:bg-slate-800 transition shadow-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-blue-400 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-400 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-6 border border-indigo-100 animate-fade-in">
            <TrendingUp className="w-3 h-3" />
            <span>THE #1 LEAD GENERATION TOOL FOR FREELANCERS</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-8 leading-[1.1] animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Hunt Better Leads. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Close Faster Deals.</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Avrina LeadScout uses advanced AI to find your ideal clients, analyze their pain points, and write the perfect outreach scripts—so you can focus on doing what you love.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <button 
              onClick={onGetStarted}
              className="group w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition shadow-xl hover:shadow-indigo-200/50 flex items-center justify-center gap-2"
            >
              Start Hunting Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto bg-white border border-slate-200 text-slate-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition"
            >
              Try Guest Mode
            </button>
          </div>
          
          <div className="mt-16 relative animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur-2xl opacity-10"></div>
            <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl p-2 md:p-4 overflow-hidden">
               <img 
                 src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426" 
                 alt="App Preview" 
                 className="rounded-2xl w-full h-auto object-cover"
               />
            </div>
          </div>
        </div>
      </header>

      {/* Stats/Logos */}
      <section className="py-12 border-y border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-50 grayscale">
          <div className="flex items-center gap-2 font-bold text-xl"><Globe className="w-6 h-6" /> GLOBAL</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Target className="w-6 h-6" /> TARGETED</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Zap className="w-6 h-6" /> INSTANT</div>
          <div className="flex items-center gap-2 font-bold text-xl"><Briefcase className="w-6 h-6" /> PREMIUM</div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">Everything you need to grow.</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One platform, unlimited potential. Stop manual searching and start intelligent hunting.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition group">
                <div className="mb-6 p-3 bg-white rounded-2xl w-fit shadow-sm group-hover:scale-110 transition">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-3 text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Documentation / How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black mb-8 leading-tight">Professional Lead Management <br /> <span className="text-indigo-600">Reimagined.</span></h2>
              
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">1</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Set Your Target</h4>
                    <p className="text-slate-500 text-sm">Define your niche, role, and bio. Upload your resume and let our AI understand exactly who you are and what you offer.</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">2</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Identify & Analyze</h4>
                    <p className="text-slate-500 text-sm">Find leads on any platform. Use our Screen Capture tool to let AI "see" the lead's profile and identify critical pain points instantly.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">3</div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">Outreach & Track</h4>
                    <p className="text-slate-500 text-sm">Send personalized scripts generated by AI. Track every stage of the deal—from 'To Do' to 'Won'—and watch your revenue grow.</p>
                  </div>
                </div>
              </div>

              <div className="mt-10 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AVERAGE ROI</p>
                  <p className="text-2xl font-black text-slate-800">340% Revenue Increase</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-[2rem] shadow-2xl p-4 border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="font-bold">Weekly Performance</h5>
                    <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-1 rounded">Update Live</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      { l: 'New Leads', v: 48, p: 70 },
                      { l: 'Outreach Sent', v: 32, p: 45 },
                      { l: 'Meetings Set', v: 8, p: 20 },
                      { l: 'Revenue Goal', v: '$4,200', p: 85 },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-1.5 text-slate-500 uppercase tracking-tight">
                          <span>{item.l}</span>
                          <span>{item.v}</span>
                        </div>
                        <div className="w-full bg-white h-2 rounded-full overflow-hidden border border-slate-200">
                          <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${item.p}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-slate-900 text-white p-6 rounded-3xl shadow-2xl max-w-[200px] animate-bounce-slow">
                 <MousePointer2 className="w-8 h-8 mb-4 text-indigo-400" />
                 <p className="text-xs font-medium opacity-80 leading-relaxed">"This app changed my freelancing game forever."</p>
                 <p className="text-[10px] font-bold mt-2 text-indigo-400">@matiasaustin</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-8 relative z-10">Ready to find your next <br /> big client?</h2>
            <p className="text-indigo-100 mb-10 text-lg max-w-xl mx-auto relative z-10">Join 1,000+ freelancers who are already using Avrina LeadScout to automate their business growth.</p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition shadow-lg active:scale-95"
              >
                Create Free Account
              </button>
              <p className="text-xs font-medium text-indigo-200 mt-4 sm:mt-0">No credit card required. Cancel anytime.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                {config.appLogo ? (
                  <img src={config.appLogo} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                )}
                <span className="text-xl font-bold tracking-tight text-slate-800">{config.appName || 'Avrina LeadScout'}</span>
              </div>
              <p className="text-slate-500 max-w-sm leading-relaxed text-sm mb-6">
                Avrina LeadScout is the ultimate companion for freelancers. We help you find, analyze, and close leads using cutting-edge AI technology.
              </p>
              <div className="flex items-center gap-4">
                <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"><Globe className="w-5 h-5" /></button>
                <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"><Users className="w-5 h-5" /></button>
                <button className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition"><MessageSquare className="w-5 h-5" /></button>
              </div>
            </div>
            <div>
              <h6 className="font-bold text-slate-800 mb-6">Product</h6>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-indigo-600 transition">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-indigo-600 transition">Strategy</a></li>
                <li><button onClick={onViewBlog} className="hover:text-indigo-600 transition">Latest Blog</button></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h6 className="font-bold text-slate-800 mb-6">Company</h6>
              <ul className="space-y-4 text-sm text-slate-500">
                <li><a href="#" className="hover:text-indigo-600 transition">About Us</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-indigo-600 transition">Privacy Policy</a></li>
                <li><button onClick={onGetStarted} className="hover:text-indigo-600 transition">Contact Support</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">© 2026 {config.appName || 'Avrina LeadScout'}. ALL RIGHTS RESERVED.</p>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Designed by {config.signature || 'Matias Austin'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
