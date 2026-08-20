import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SearchPromptBar } from './components/SearchPromptBar';
import { PipelineProgress } from './components/PipelineProgress';
import { CardView } from './components/CardView';
import { CardArchiveGrid } from './components/CardArchiveGrid';
import { CardFollowUpChat } from './components/CardFollowUpChat';
import { ExportPosterModal } from './components/ExportPosterModal';
import { SettingsModal } from './components/SettingsModal';
import { LoginModal } from './components/LoginModal';
import { CardRecord, PipelineStatus, AppSettings, AudienceTier, AuthState } from './types';
import { ApiService } from './services/api';
import { Language, getTranslation } from './utils/i18n';
import { Sparkles, AlertCircle, LogIn, Lock, BookOpen } from 'lucide-react';

const DEFAULT_SETTINGS: AppSettings = {
  openRouterKey: '',
  tavilyKey: '',
  model: 'google/gemini-3.7-flash',
  imageModel: 'google/gemini-3.1-flash-lite-image',
  theme: 'dark',
  language: 'zh',
};

export const App: React.FC = () => {
  // --- Persistent App Settings ---
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('snapcard_settings');
    if (saved) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to parse settings', e);
      }
    }
    return DEFAULT_SETTINGS;
  });

  const [lang, setLang] = useState<Language>(() => {
    return settings.language === 'en' ? 'en' : 'zh';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return settings.theme || 'dark';
  });

  // --- Auth State ---
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: 'guest',
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const checkAuth = async () => {
    try {
      const status = await ApiService.getAuthStatus();
      setAuth(status);
    } catch (e) {
      setAuth({ isAuthenticated: false, role: 'guest' });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Apply Dark mode class to html document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('snapcard_settings', JSON.stringify(newSettings));
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    handleSaveSettings({ ...settings, theme: next });
  };

  const handleToggleLang = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
    handleSaveSettings({ ...settings, language: next });
  };

  const handleLogout = async () => {
    await ApiService.logout();
    setAuth({ isAuthenticated: false, role: 'guest' });
    setCurrentCard(null);
    setRefreshTrigger((c) => c + 1);
  };

  // --- App Views & Data State ---
  const [activeView, setActiveView] = useState<'home' | 'archive'>('home');
  const [currentCard, setCurrentCard] = useState<CardRecord | null>(null);
  const [cardCount, setCardCount] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Streaming & Pipeline Progress
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatus | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals & Follow-up State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [followUpCard, setFollowUpCard] = useState<CardRecord | null>(null);
  const [initialFollowUpQuery, setInitialFollowUpQuery] = useState<string | null>(null);
  const [exportCard, setExportCard] = useState<CardRecord | null>(null);

  const t = getTranslation(lang);
  const isAdmin = auth.role === 'admin';

  // Load initial card count and latest card
  const refreshCardStats = async () => {
    try {
      const res = await ApiService.getCards({ limit: 1 });
      setCardCount(res.total);
      if (res.cards.length > 0 && !currentCard && activeView === 'home') {
        setCurrentCard(res.cards[0]);
      }
    } catch (e) {
      console.warn('Failed to load initial card stats:', e);
    }
  };

  useEffect(() => {
    refreshCardStats();
  }, [refreshTrigger, auth.role]);

  // Handle Card Generation Trigger (Admin only)
  const handleGenerateCard = async (params: {
    query: string;
    audience: AudienceTier;
    needImage: boolean;
    photoUrl?: string;
  }) => {
    if (!isAdmin) {
      setIsLoginOpen(true);
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setPipelineStatus({
      step: 'intent',
      message: lang === 'zh' ? '正在分析意图与检索策略...' : 'Analyzing intent & search strategy...',
      stepNumber: 1,
      totalSteps: 4,
    });
    setActiveView('home');

    try {
      await ApiService.generateCardStream(
        params,
        settings,
        {
          onStatus: (status) => {
            setPipelineStatus(status);
          },
          onCard: (card) => {
            setCurrentCard(card);
            setCardCount((prev) => prev + 1);
            setRefreshTrigger((c) => c + 1);
          },
          onComplete: () => {
            setIsGenerating(false);
            setPipelineStatus(null);
          },
          onError: (err) => {
            setErrorMessage(err);
            setIsGenerating(false);
            setPipelineStatus(null);
          },
        }
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Generation failed');
      setIsGenerating(false);
      setPipelineStatus(null);
    }
  };

  // Card Actions
  const handleToggleFavorite = async (id: string) => {
    if (!isAdmin) return;
    try {
      const newFav = await ApiService.toggleFavorite(id);
      if (currentCard && currentCard.id === id) {
        setCurrentCard({ ...currentCard, isFavorite: newFav });
      }
      setRefreshTrigger((c) => c + 1);
    } catch (e) {
      console.error('Failed to toggle favorite', e);
    }
  };

  const handleTogglePublic = async (id: string) => {
    if (!isAdmin) return;
    try {
      const newPublic = await ApiService.togglePublic(id);
      if (currentCard && currentCard.id === id) {
        setCurrentCard({ ...currentCard, isPublic: newPublic });
      }
      setRefreshTrigger((c) => c + 1);
    } catch (e) {
      console.error('Failed to toggle public', e);
    }
  };

  const handleDeleteCard = async (id: string) => {
    if (!isAdmin) return;
    try {
      await ApiService.deleteCard(id);
      if (currentCard && currentCard.id === id) {
        setCurrentCard(null);
      }
      setRefreshTrigger((c) => c + 1);
    } catch (e) {
      console.error('Failed to delete card', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Navbar */}
      <Navbar
        lang={lang}
        onToggleLang={handleToggleLang}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        auth={auth}
        activeView={activeView}
        onSelectView={(v) => setActiveView(v)}
        cardCount={cardCount}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-24 md:pb-16">
        
        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-4xl mx-auto px-4 mt-4 animate-fade-in">
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs sm:text-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs underline hover:opacity-80"
              >
                {t.dismiss}
              </button>
            </div>
          </div>
        )}

        {/* Guest Notification Banner */}
        {!isAdmin && (
          <div className="max-w-4xl mx-auto px-4 mt-4 animate-fade-in">
            <div className="p-4 rounded-2xl glass-panel border border-brand-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {t.guestBannerTitle}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {t.guestBannerDesc}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLoginOpen(true)}
                className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t.adminSignIn}</span>
              </button>
            </div>
          </div>
        )}

        {/* View 1: Home / Generator */}
        {activeView === 'home' && (
          <div className="space-y-6 pt-3 sm:pt-8">
            
            {/* Hero Title & Subtitle */}
            <div className="text-center px-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 text-xs font-semibold mb-2 sm:mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t.appTitle}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-2 sm:mb-3">
                <span className="bg-gradient-to-r from-slate-900 via-brand-700 to-indigo-600 dark:from-white dark:via-brand-300 dark:to-indigo-200 bg-clip-text text-transparent">
                  {lang === 'zh' ? '秒级提炼，知识立现' : 'Instant Visual Knowledge'}
                </span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
                {t.appSubtitle}
              </p>
            </div>

            {/* Interactive Search Bar (Disabled for guest or triggers login) */}
            {isAdmin ? (
              <SearchPromptBar
                lang={lang}
                onGenerate={handleGenerateCard}
                isLoading={isGenerating}
              />
            ) : (
              <div className="w-full max-w-4xl mx-auto px-4">
                <div
                  onClick={() => setIsLoginOpen(true)}
                  className="glass-panel rounded-2xl sm:rounded-3xl p-5 shadow-lg border border-dashed border-brand-500/40 text-center cursor-pointer hover:border-brand-500 transition-all group"
                >
                  <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 mb-1">
                    {t.guestPromptTitle}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t.guestPromptDesc}
                  </p>
                </div>
              </div>
            )}

            {/* Stepper Progress */}
            {isGenerating && (
              <PipelineProgress status={pipelineStatus} lang={lang} />
            )}

            {/* Current Active Card */}
            {currentCard && (
              <CardView
                card={currentCard}
                lang={lang}
                theme={theme}
                auth={auth}
                onToggleFavorite={handleToggleFavorite}
                onTogglePublic={handleTogglePublic}
                onDelete={handleDeleteCard}
                onOpenFollowUp={(c, initialQ) => {
                  setFollowUpCard(c);
                  setInitialFollowUpQuery(initialQ || null);
                }}
                onOpenExport={(c) => setExportCard(c)}
              />
            )}

          </div>
        )}

        {/* View 2: Archive Library */}
        {activeView === 'archive' && (
          <CardArchiveGrid
            lang={lang}
            onSelectCard={(c) => {
              setCurrentCard(c);
              setActiveView('home');
            }}
            onToggleFavorite={handleToggleFavorite}
            onDeleteCard={handleDeleteCard}
            refreshTrigger={refreshTrigger}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400">
        <p>SnapCard · Powered by Gemini 3.7 Flash & Tavily Search · Client-side SVG Mermaid</p>
      </footer>

      {/* Mobile Bottom Navigation Dock (Native App UX) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 px-6 py-2 flex items-center justify-around shadow-2xl safe-area-pb">
        <button
          onClick={() => setActiveView('home')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            activeView === 'home'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeView === 'home' ? 'bg-brand-500/10' : ''}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-[11px]">{isAdmin ? t.navCreate : t.navExplore}</span>
        </button>

        <button
          onClick={() => setActiveView('archive')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all relative ${
            activeView === 'archive'
              ? 'text-brand-600 dark:text-brand-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeView === 'archive' ? 'bg-brand-500/10' : ''} relative`}>
            <BookOpen className="w-5 h-5" />
            {cardCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-brand-500 text-white min-w-[16px] text-center">
                {cardCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">{t.archiveTitle}</span>
        </button>
      </nav>

      {/* In-Card Follow-up Q&A Drawer (Admin only) */}
      <CardFollowUpChat
        card={followUpCard}
        isOpen={!!followUpCard}
        onClose={() => {
          setFollowUpCard(null);
          setInitialFollowUpQuery(null);
        }}
        lang={lang}
        settings={settings}
        initialQuestion={initialFollowUpQuery}
        onClearInitialQuestion={() => setInitialFollowUpQuery(null)}
      />

      {/* Poster Export Modal */}
      <ExportPosterModal
        card={exportCard}
        isOpen={!!exportCard}
        onClose={() => setExportCard(null)}
        lang={lang}
      />

      {/* Settings Modal (Admin only) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        lang={lang}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setAuth({ isAuthenticated: true, role: 'admin', username: user.username });
          setRefreshTrigger((c) => c + 1);
        }}
        lang={lang}
      />

    </div>
  );
};
