import React, { useState } from 'react';
import { X, Lock, User, ShieldCheck, Clock, LogIn, AlertCircle } from 'lucide-react';
import { ApiService } from '../services/api';
import { getTranslation, Language } from '../utils/i18n';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
  lang: Language;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  lang,
}) => {
  const t = getTranslation(lang);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [ttlDays, setTtlDays] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await ApiService.login({
        username: username.trim(),
        password,
        ttlDays,
      });

      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || t.loginFailed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-slate-800/80 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                {t.loginModalTitle}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {t.loginModalDesc}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-3.5 sm:space-y-4 text-xs sm:text-sm">
          
          {/* Username */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {t.loginUsername}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {t.loginPassword}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 sm:py-2.5 outline-none focus:border-brand-500 transition-colors"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {t.loginDefaultHint}
            </p>
          </div>

          {/* Cookie TTL Selector */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-500" />
              <span>{t.loginTtlLabel}</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { days: 7, label: t.loginTtl7d },
                { days: 30, label: t.loginTtl30d },
                { days: 90, label: t.loginTtl90d },
                { days: 365, label: t.loginTtl365d },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => setTtlDays(opt.days)}
                  className={`py-1.5 px-2 rounded-xl border text-center font-medium transition-all ${
                    ttlDays === opt.days
                      ? 'bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/40 shadow-sm font-semibold'
                      : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{t.loginSubmit}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
