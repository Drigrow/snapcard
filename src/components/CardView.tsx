import React, { useState } from 'react';
import {
  Heart,
  Share2,
  Copy,
  MessageSquare,
  Trash2,
  Sparkles,
  ExternalLink,
  Check,
  Globe,
  Palette,
  Camera,
  Layers,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CardRecord, AuthState } from '../types';
import { MermaidViewer } from './MermaidViewer';
import { InteractiveMarkdown } from './InteractiveMarkdown';
import { getTranslation, Language } from '../utils/i18n';

interface CardViewProps {
  card: CardRecord;
  lang: Language;
  theme: 'dark' | 'light';
  auth: AuthState;
  onToggleFavorite: (id: string) => void;
  onTogglePublic?: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenFollowUp: (card: CardRecord, initialQuestion?: string) => void;
  onOpenExport: (card: CardRecord) => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  lang,
  theme,
  auth,
  onToggleFavorite,
  onTogglePublic,
  onDelete,
  onOpenFollowUp,
  onOpenExport,
}) => {
  const t = getTranslation(lang);
  const isAdmin = auth.role === 'admin';
  const [copied, setCopied] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);

  const audienceBadgeMap = {
    student: {
      label: t.audienceStudent,
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    general: {
      label: t.audienceGeneral,
      bg: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
    },
    expert: {
      label: t.audienceExpert,
      bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  };

  const audienceBadge = audienceBadgeMap[card.audience] || audienceBadgeMap.general;

  const handleCopyMarkdown = () => {
    const md = `# ${card.title}\n\n> 💡 **${lang === 'zh' ? '核心金句' : 'Key Essence'}**：${card.oneLiner || ''}\n\n${card.content}\n\n${
      card.diagram ? `\`\`\`mermaid\n${card.diagram}\n\`\`\`\n\n` : ''
    }*${lang === 'zh' ? '标签' : 'Tags'}*: ${card.tags.map((t) => `#${t}`).join(' ')}`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    onToggleFavorite(card.id);
    if (!card.isFavorite) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  const handleAskTerm = (term: string) => {
    const question = `${t.termQueryPrefix}${term}${t.termQuerySuffix}`;
    onOpenFollowUp(card, question);
  };

  return (
    <article className="w-full max-w-4xl mx-auto my-4 sm:my-6 px-3 sm:px-4">
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl sm:shadow-2xl border border-slate-200/90 dark:border-slate-800/90 transition-all relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header: Badge, Public Switch (Admin), Tags, Time */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 sm:pb-4 mb-3 sm:mb-4 border-b border-slate-100 dark:border-slate-800/60 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold border ${audienceBadge.bg}`}>
              {audienceBadge.label}
            </span>

            {/* Admin Public Toggle */}
            {isAdmin && onTogglePublic && (
              <button
                type="button"
                onClick={() => onTogglePublic(card.id)}
                title={card.isPublic ? t.publicToggleTitleToPrivate : t.publicToggleTitleToPublic}
                className={`flex items-center gap-1 px-2.5 py-0.5 sm:py-1 rounded-full border transition-all text-[11px] sm:text-xs font-medium ${
                  card.isPublic
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                }`}
              >
                {card.isPublic ? <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <EyeOff className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                <span>{card.isPublic ? t.publicToGuests : t.privateToAdmin}</span>
              </button>
            )}

            {card.tags.map((tag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800 text-[10px] sm:text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="text-slate-400 text-[10px] sm:text-[11px] shrink-0">
            {new Date(card.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3 sm:mb-4 leading-snug break-words">
          {card.title}
        </h1>

        {/* OneLiner Golden Essence Box */}
        {card.oneLiner && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-purple-500/10 border border-brand-500/20 dark:border-brand-500/30 flex items-start gap-2.5 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs sm:text-base font-semibold text-slate-800 dark:text-brand-100 leading-relaxed">
              {card.oneLiner}
            </p>
          </div>
        )}

        {/* Images Gallery (Display completely without cropping) */}
        {card.images && card.images.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className={`grid gap-3 ${card.images.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
              {card.images.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveImageModal(img.url)}
                  className="relative group rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/60 cursor-pointer flex items-center justify-center p-1 sm:p-2 hover:border-brand-500/40 transition-colors"
                >
                  <img
                    src={img.url}
                    alt={img.alt || card.title}
                    className="w-full h-auto max-h-[480px] object-contain rounded-xl group-hover:scale-[1.01] transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  {/* Image source badge */}
                  <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-md text-[10px] text-white font-medium flex items-center gap-1 border border-white/10 shadow-sm">
                    {img.source === 'web' && <Globe className="w-3 h-3 text-sky-400" />}
                    {img.source === 'generated' && <Palette className="w-3 h-3 text-purple-400" />}
                    {img.source === 'uploaded' && <Camera className="w-3 h-3 text-emerald-400" />}
                    <span>
                      {img.source === 'web'
                        ? t.sourceWeb
                        : img.source === 'generated'
                        ? t.sourceGen
                        : t.sourceUpload}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Markdown Content Body with Interactive Terminology Highlighting */}
        <div className="markdown-body text-slate-700 dark:text-slate-300 text-xs sm:text-base mb-4 sm:mb-6 break-words overflow-hidden">
          <InteractiveMarkdown
            content={card.content}
            lang={lang}
            onAskTerm={handleAskTerm}
          />
        </div>

        {/* Mermaid Diagram */}
        {card.diagram && (
          <MermaidViewer chart={card.diagram} theme={theme} title={t.diagramTitle} lang={lang} />
        )}

        {/* Bottom Action Tool Bar */}
        <div className="mt-6 sm:mt-8 pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          
          {/* Left Actions: Favorite & Follow-up */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <>
                <button
                  onClick={handleFavoriteClick}
                  className={`flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl border transition-all ${
                    card.isFavorite
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${card.isFavorite ? 'fill-rose-500' : ''}`} />
                  <span>{card.isFavorite ? t.favorited : t.favorite}</span>
                </button>

                <button
                  onClick={() => onOpenFollowUp(card)}
                  className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30 hover:bg-brand-500/20 font-medium transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t.askFollowUp}</span>
                </button>
              </>
            ) : (
              <span className="text-slate-400 text-xs flex items-center gap-1.5 py-1">
                <Lock className="w-3.5 h-3.5" />
                <span>{t.guestReadOnlyNotice}</span>
              </span>
            )}
          </div>

          {/* Right Actions: Export, Copy, Delete */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={handleCopyMarkdown}
              title={t.copyMarkdown}
              className="flex-1 sm:flex-initial justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span className="text-xs">{copied ? t.copied : t.copyMarkdown}</span>
            </button>

            <button
              onClick={() => onOpenExport(card)}
              title={t.exportCard}
              className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>{t.exportCard}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm(t.deleteConfirm)) {
                    onDelete(card.id);
                  }
                }}
                title={t.delete}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Image zoom modal */}
      {activeImageModal && (
        <div
          onClick={() => setActiveImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <img
            src={activeImageModal}
            alt="Enlarged preview"
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
        </div>
      )}
    </article>
  );
};
