import React, { useState, useEffect } from 'react';
import { Search, Heart, Tag, BookOpen, Trash2 } from 'lucide-react';
import { CardRecord } from '../types';
import { ApiService } from '../services/api';
import { getTranslation, Language } from '../utils/i18n';

interface CardArchiveGridProps {
  lang: Language;
  onSelectCard: (card: CardRecord) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteCard: (id: string) => void;
  refreshTrigger: number;
}

export const CardArchiveGrid: React.FC<CardArchiveGridProps> = ({
  lang,
  onSelectCard,
  onToggleFavorite,
  onDeleteCard,
  refreshTrigger,
}) => {
  const t = getTranslation(lang);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAudience, setSelectedAudience] = useState<string>('');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const res = await ApiService.getCards({
        search: search.trim() || undefined,
        audience: selectedAudience || undefined,
        favoriteOnly,
        limit: 100,
      });
      setCards(res.cards || []);
    } catch (err) {
      console.error('Failed to load cards:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, [search, selectedAudience, favoriteOnly, refreshTrigger]);

  return (
    <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      
      {/* Top Header & Search Bar */}
      <div className="glass-panel rounded-2xl p-3.5 sm:p-5 mb-4 sm:mb-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 sm:top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchArchivePlaceholder}
            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2 text-xs">
          {/* Favorite Toggle */}
          <button
            onClick={() => setFavoriteOnly(!favoriteOnly)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              favoriteOnly
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${favoriteOnly ? 'fill-rose-500' : ''}`} />
            <span>{t.favoritesOnly}</span>
          </button>

          {/* Audience Filter */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setSelectedAudience('')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedAudience === ''
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => setSelectedAudience('student')}
              title={t.audienceStudent}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedAudience === 'student'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              🧸
            </button>
            <button
              onClick={() => setSelectedAudience('general')}
              title={t.audienceGeneral}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedAudience === 'general'
                  ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ☕
            </button>
            <button
              onClick={() => setSelectedAudience('expert')}
              title={t.audienceExpert}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedAudience === 'expert'
                  ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              🎓
            </button>
          </div>
        </div>

      </div>

      {/* Cards Feed / Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-16 sm:py-20 glass-panel rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800">
          <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 opacity-50" />
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm max-w-md mx-auto">
            {t.noCardsFound}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {cards.map((c) => (
            <div
              key={c.id}
              onClick={() => onSelectCard(c)}
              className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 dark:hover:border-brand-500/40 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                {/* Image thumb if any */}
                {c.images && c.images[0] && (
                  <div className="mb-3 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center p-1 aspect-video">
                    <img
                      src={c.images[0].url}
                      alt={c.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 rounded-lg"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Badge & Favorite */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                    {c.audience.toUpperCase()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(c.id);
                    }}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Heart className={`w-4 h-4 ${c.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                {/* Title */}
                <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5 group-hover:text-brand-500 transition-colors line-clamp-1">
                  {c.title}
                </h3>

                {/* OneLiner */}
                {c.oneLiner && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                    {c.oneLiner}
                  </p>
                )}
              </div>

              {/* Tags & Time */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-1 overflow-hidden">
                  <Tag className="w-3 h-3 text-brand-500 flex-shrink-0" />
                  <span className="truncate">{c.tags.slice(0, 2).join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(t.deleteConfirm)) {
                        onDeleteCard(c.id);
                      }
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span>{new Date(c.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
