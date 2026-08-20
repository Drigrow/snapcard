import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, Sparkles, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { CardRecord } from '../types';
import { getTranslation, Language } from '../utils/i18n';
import { preprocessMarkdown } from '../utils/markdown';

interface ExportPosterModalProps {
  card: CardRecord | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const ExportPosterModal: React.FC<ExportPosterModalProps> = ({
  card,
  isOpen,
  onClose,
  lang,
}) => {
  const t = getTranslation(lang);
  const posterRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen || !card) return null;

  const handleDownload = async () => {
    if (!posterRef.current) return;
    setIsExporting(true);

    try {
      // Allow images and fonts to settle
      await new Promise((resolve) => setTimeout(resolve, 300));

      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2.5, // Ultra crisp resolution
        quality: 0.98,
        backgroundColor: '#090d16',
      });

      const link = document.createElement('a');
      link.download = `SnapCard_${card.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '_')}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('Failed to export poster:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="glass-panel w-full max-w-xl rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-brand-500" />
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {t.exportPosterHeader}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Poster Preview Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-1 sm:p-2 flex justify-center bg-slate-950/40 rounded-xl sm:rounded-2xl border border-slate-800/60 my-1 sm:my-2">
          
          {/* Target Capture Area */}
          <div
            ref={posterRef}
            className="w-full max-w-[420px] bg-gradient-to-b from-slate-900 via-[#0b1120] to-[#080d1a] text-slate-100 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-800 relative flex flex-col justify-between"
          >
            {/* Top Branding & Audience Pill */}
            <div>
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <span className="font-extrabold text-xs sm:text-sm tracking-tight bg-gradient-to-r from-white via-brand-300 to-indigo-200 bg-clip-text text-transparent">
                    SnapCard · {lang === 'zh' ? '随手查' : 'Visual Cards'}
                  </span>
                </div>
                <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-brand-500/20 text-brand-400 border border-brand-500/30">
                  {card.audience.toUpperCase()}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug mb-2 sm:mb-3 break-words">
                {card.title}
              </h2>

              {/* OneLiner Essence */}
              {card.oneLiner && (
                <div className="p-2.5 sm:p-3 rounded-xl bg-brand-500/10 border border-brand-500/25 mb-3 sm:mb-4 text-xs font-medium text-brand-200 leading-relaxed break-words">
                  💡 {card.oneLiner}
                </div>
              )}

              {/* Image if available (Display fully without cropping) */}
              {card.images && card.images[0] && (
                <div className="mb-3 sm:mb-4 rounded-xl overflow-hidden border border-slate-800 bg-slate-950/80 flex items-center justify-center p-1">
                  <img
                    src={card.images[0].url}
                    alt={card.title}
                    className="w-full h-auto max-h-72 object-contain rounded-lg"
                    crossOrigin="anonymous"
                  />
                </div>
              )}

              {/* Full Markdown body with CJK boundary & delimiter preprocessor */}
              <div className="markdown-body text-xs text-slate-300 leading-relaxed mb-3 sm:mb-4 break-words">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {preprocessMarkdown(card.content)}
                </ReactMarkdown>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">
                {card.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-slate-800/80 text-[9px] sm:text-[10px] text-slate-400 border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Poster Footer with Watermark */}
            <div className="pt-2.5 sm:pt-3 border-t border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span>Gemini 3.7 Flash & Tavily Search</span>
              </div>
              <div>{new Date(card.createdAt).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US')}</div>
            </div>

          </div>

        </div>

        {/* Download Action */}
        <div className="pt-2.5 sm:pt-3 flex items-center justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-brand-500/25 disabled:opacity-50 transition-all"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : downloaded ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{t.exportSuccess}</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>{t.downloadPosterBtn}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
