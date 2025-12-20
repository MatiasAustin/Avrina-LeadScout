import React, { useState, useEffect } from 'react';
import { login, register, loginAsGuest, resendConfirmation, sendPasswordReset, updatePassword } from '../services/auth';
import { User, AppConfig, Language } from '../types';
import { Sparkles, ArrowRight, User as UserIcon, Lock, Loader2, AlertCircle, Mail, ChevronLeft, CheckCircle } from 'lucide-center';
import { getTranslation } from '../utils/i18n';
import { supabase } from '../services/supabase';

interface Props {
  onAuthSuccess: (user: User) => void;
  config?: AppConfig; 
  language: Language;
  setLanguage: (lang: Language) => void;
  forceUpdatePassword?: boolean; // NEW PROP
}

const AuthScreen: React.FC<Props> = ({ onAuthSuccess, config, language, setLanguage, forceUpdatePassword }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(forceUpdatePassword || false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const t = (key: any) => getTranslation(language, key);
  const appName = config?.appName || "Avrina LeadScout";
  const appLogo = config?.appLogo;

  // Sync state if prop changes
  useEffect(() => {
    if (forceUpdatePassword) {
      setIsUpdatePassword(true);
      setIsLogin(false);
      setIsForgotPassword(false);
    }
  }, [forceUpdatePassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResend(false);
    setLoading(true);
    
    try {
      if (isUpdatePassword) {
        if (password !== confirmPassword) {
          throw new Error(t('passwords_not_match'));
        }
        await updatePassword(password);
        setSuccess(t('update_password_success'));
        // Automatically switch back to login after success
        setTimeout(() => {
           setIsUpdatePassword(false);
           setIsLogin(true);
           setSuccess('');
           setPassword('');
           setConfirmPassword('');
           // If we force redirected, we might want to refresh the app state
           window.location.hash = ''; // Clear tokens from URL
        }, 3000);
      } else if (isForgotPassword) {
        await sendPasswordReset(email);
        setSuccess(t('reset_success'));
      } else if (isLogin) {
        const user = await login(email, password);
        onAuthSuccess(user);
      } else {
        if (!name) throw new Error("Name is required");
        const user = await register(name, email, password);
        onAuthSuccess(user);
      }
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Authentication failed.";
      if (msg.toLowerCase().includes("email not confirmed")) {
         setShowResend(true);
         msg = "Email address not confirmed. Please check your inbox.";
      } else if (msg.includes("Confirmation email sent")) {
         setIsLogin(true); 
         msg = "Account created! Please check your email to confirm before logging in.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendConfirmation(email);
      alert("Confirmation email sent! Please check your inbox.");
      setShowResend(false);
    } catch (e: any) {
      alert("Failed to resend: " + e.message);
    } finally {
      setResendLoading(false);
    }
  };

  const handleGuest = () => {
    const guest = loginAsGuest();
    onAuthSuccess(guest);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
         <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
             <button 
               onClick={() => setLanguage('en')}
               className={`text-xs font-bold px-3 py-1.5 rounded ${language === 'en' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
             >
               EN
             </button>
             <button 
               onClick={() => setLanguage('id')}
               className={`text-xs font-bold px-3 py-1.5 rounded ${language === 'id' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
             >
               ID
             </button>
         </div>
      </div>

      <div className="mb-8 text-center animate-fade-in">
        <div className="flex items-center justify-center gap-2 mb-4">
           {appLogo ? (
             <img src={appLogo} alt="Logo" className="w-24 h-24 object-contain" />
           ) : (
             <div className="p-3 bg-slate-800 rounded-xl shadow-lg">
               <Sparkles className="w-8 h-8 text-slate-50" />
             </div>
           )}
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{appName}</h1>
        <p className="text-slate-500">Intelligent Client Hunting for Freelancers</p>
      </div>

      <div className="bg-slate-50 p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md animate-fade-in">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          {isUpdatePassword ? (
             t('reset_password_now_title')
          ) : isForgotPassword ? (
            <>
              <button 
                onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }}
                className="p-1.5 hover:bg-slate-200 rounded-full transition text-slate-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {t('forgot_password_title')}
            </>
          ) : (
            isLogin ? t('welcome_back') : t('create_account')
          )}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-lg text-sm animate-fade-in">
            <div className="flex items-start gap-2 text-red-700 font-medium">
               <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
               <p>{error}</p>
            </div>
            
            {showResend && (
              <div className="mt-3 pl-6 space-y-3">
                 <button 
                   onClick={handleResend}
                   disabled={resendLoading}
                   className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1.5 rounded-md transition flex items-center gap-2 font-semibold"
                 >
                   {resendLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                   Resend Confirmation Email
                 </button>
              </div>
            )}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-lg text-sm animate-fade-in">
            <div className="flex items-start gap-2 text-green-700 font-medium">
               <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
               <p>{success}</p>
            </div>
            {(isForgotPassword || isUpdatePassword) && (
              <button 
                onClick={() => { setIsForgotPassword(false); setIsUpdatePassword(false); setSuccess(''); }}
                className="mt-4 text-xs font-bold text-slate-700 hover:underline flex items-center gap-1"
              >
                <ChevronLeft className="w-3 h-3" /> {t('back_to_login')}
              </button>
            )}
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isForgotPassword && (
              <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                {t('reset_instructions')}
              </p>
            )}

            {!isLogin && !isForgotPassword && !isUpdatePassword && (
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
                    required
                  />
                </div>
              </div>
            )}

            {!isUpdatePassword && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
                  placeholder="you@example.com"
                  required
                />
              </div>
            )}

            {!isForgotPassword && (
              <>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-500 uppercase">
                      {isUpdatePassword ? t('new_password_label') : 'Password'}
                    </label>
                    {isLogin && (
                      <button 
                        type="button"
                        onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }}
                        className="text-[10px] font-bold text-slate-500 hover:text-slate-800 hover:underline transition"
                      >
                        {t('forgot_password_link')}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {isUpdatePassword && (
                   <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t('confirm_password_label')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-800 outline-none transition text-sm text-slate-800"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-slate-50 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                isUpdatePassword ? t('btn_update_password') :
                isForgotPassword ? t('btn_send_reset') : (isLogin ? 'Sign In' : 'Sign Up')
              )}
            </button>
          </form>
        )}

        {!isUpdatePassword && !success && (
          <div className="mt-6 flex flex-col gap-4">
             <div className="relative flex items-center justify-center">
               <div className="absolute inset-x-0 border-t border-slate-100"></div>
               <span className="relative bg-slate-50 px-2 text-xs text-slate-400 uppercase tracking-widest">OR</span>
             </div>

             <button 
               onClick={handleGuest}
               className="w-full bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 font-medium py-2.5 rounded-lg transition text-sm flex items-center justify-center gap-2 shadow-sm"
             >
               {t('guest_mode')}
               <ArrowRight className="w-4 h-4" />
             </button>
          </div>
        )}

        {!isUpdatePassword && (
          <p className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? (
              <>
                Don't have an account?{" "}
                <button 
                  onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(''); setSuccess(''); }}
                  className="text-slate-800 font-semibold hover:underline"
                >
                  Register
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button 
                  onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(''); setSuccess(''); }}
                  className="text-slate-800 font-semibold hover:underline"
                >
                  Login
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
