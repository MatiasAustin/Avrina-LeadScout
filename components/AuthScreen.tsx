import React, { useState } from 'react';
import { login, register, loginAsGuest } from '../services/auth';
import { User, AppConfig } from '../types';
import { Sparkles, ArrowRight, User as UserIcon, Lock, Loader2, AlertCircle } from 'lucide-react';

interface Props {
  onAuthSuccess: (user: User) => void;
  config?: AppConfig; // Now accepts config for branding
}

const AuthScreen: React.FC<Props> = ({ onAuthSuccess, config }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Default branding if config not yet loaded
  const appName = config?.appName || "Avrina LeadScout";
  const appLogo = config?.appLogo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isLogin) {
        const user = await login(email, password);
        onAuthSuccess(user);
      } else {
        if (!name) throw new Error("Name is required");
        const user = await register(name, email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guest = loginAsGuest();
    onAuthSuccess(guest);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-2">
           <div className="p-3 bg-slate-800 rounded-xl shadow-lg">
             {appLogo ? (
               <img src={appLogo} alt="Logo" className="w-8 h-8 object-contain" />
             ) : (
               <Sparkles className="w-8 h-8 text-slate-50" />
             )}
           </div>
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{appName}</h1>
        <p className="text-slate-500">Intelligent Client Hunting for Freelancers</p>
      </div>

      <div className="bg-slate-50 p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-900 text-slate-50 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-4">
           <div className="relative flex items-center justify-center">
             <div className="absolute inset-x-0 border-t border-slate-100"></div>
             <span className="relative bg-slate-50 px-2 text-xs text-slate-400">OR</span>
           </div>

           <button 
             onClick={handleGuest}
             className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2"
           >
             Continue as Guest
             <ArrowRight className="w-4 h-4" />
           </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-slate-800 font-semibold hover:underline"
          >
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;