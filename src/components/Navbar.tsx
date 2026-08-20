import React from 'react';
import { Sparkles, Settings, Sun, Moon, Languages, BookOpen, LogIn, LogOut, ShieldCheck } from 'lucide-react';
import { getTranslation, Language } from '../utils/i18n';
import { AuthState } from '../types';

interface NavbarProps {
  lang: Language;
  onToggleLang: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  auth: AuthState;
  activeView: 'home' | 'archive';
  onSelectView: (view: 'home' | 'archive') => void;
  cardCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  onOpenSettings,
  onOpenLogin,
  onLogout,
  auth,
  activeView,
  onSelectView,
  cardCount,
}) => {
  const t = getTranslation(lang);
  const isAdmin = auth.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => onSelectView('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-600 dark:from-white dark:via-brand-400 dark:to-indigo-300 bg-clip-text text-transparent">
                SnapCard
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full border border-brand-500/20">
                Gemini 3.7
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {t.appSubtitle}
            </p>
          </div>
        </div>

        {/* Center Nav tabs */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => onSelectView('home')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeView === 'home'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isAdmin ? t.navCreate : t.navExplore}</span>
          </button>

          <button
            onClick={() => onSelectView('archive')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all relative ${
              activeView === 'archive'
                ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.archiveTitle}</span>
            {cardCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                {cardCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Auth status & trigger */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <span className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.navAdmin}</span>
              </span>
              <button
                onClick={onLogout}
                title={t.navLogoutTitle}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors flex items-center gap-1 text-xs"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t.navLogout}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-sm transition-all"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{t.navSignIn}</span>
            </button>
          )}

          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Languages className="w-4 h-4 text-brand-500" />
            <span className="hidden sm:inline">{lang === 'zh' ? 'EN' : '中'}</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? (lang === 'zh' ? '切换为亮色模式' : 'Switch to Light Mode') : (lang === 'zh' ? '切换为暗色模式' : 'Switch to Dark Mode')}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Settings Trigger (Admin only) */}
          {isAdmin && (
            <button
              onClick={onOpenSettings}
              title={t.settingsTitle}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors relative"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
