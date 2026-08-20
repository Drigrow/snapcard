import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { HelpCircle, MessageSquare, Copy, Check, X, Sparkles } from 'lucide-react';
import { getTranslation, Language } from '../utils/i18n';

interface InteractiveMarkdownProps {
  content: string;
  lang: Language;
  onAskTerm?: (term: string) => void;
  className?: string;
}

interface ActivePopover {
  term: string;
  x: number;
  y: number;
  rect: DOMRect;
}

export const InteractiveMarkdown: React.FC<InteractiveMarkdownProps> = ({
  content,
  lang,
  onAskTerm,
  className = '',
}) => {
  const t = getTranslation(lang);
  const [activePopover, setActivePopover] = useState<ActivePopover | null>(null);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setActivePopover(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };

    if (activePopover) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePopover]);

  const handleTermClick = (e: React.MouseEvent<HTMLElement>, termText: string) => {
    e.stopPropagation();
    e.preventDefault();

    const cleanTerm = termText.trim().replace(/^[*_`#]+|[*_`#]+$/g, '');
    if (!cleanTerm) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setActivePopover({
      term: cleanTerm,
      x: rect.left + rect.width / 2,
      y: rect.bottom + window.scrollY + 6,
      rect,
    });
    setCopied(false);
  };

  const handleExecuteAsk = () => {
    if (!activePopover || !onAskTerm) return;
    const term = activePopover.term;
    setActivePopover(null);
    onAskTerm(term);
  };

  const handleCopyTerm = () => {
    if (!activePopover) return;
    navigator.clipboard.writeText(activePopover.term);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ node, children, ...props }) => {
            // Extract string representation
            const termText = React.Children.toArray(children)
              .map((c) => (typeof c === 'string' ? c : ''))
              .join('');

            return (
              <strong
                {...props}
                onClick={(e) => handleTermClick(e, termText)}
                className="inline-flex items-center gap-0.5 cursor-pointer font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-400/10 hover:bg-sky-500/20 dark:hover:bg-sky-400/25 px-1.5 py-0.5 rounded-md border border-sky-500/20 dark:border-sky-400/30 transition-all duration-150 group"
                title={lang === 'zh' ? `点击查询术语「${termText}」释义` : `Click to ask what "${termText}" means`}
              >
                <span>{children}</span>
                <HelpCircle className="w-3 h-3 opacity-60 group-hover:opacity-100 text-sky-500 dark:text-sky-400 transition-opacity flex-shrink-0" />
              </strong>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Floating Term Explanation Popover */}
      {activePopover && (
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${Math.min(activePopover.rect.bottom + 8, window.innerHeight - 180)}px`,
            left: `${Math.max(16, Math.min(activePopover.rect.left, window.innerWidth - 320))}px`,
          }}
          className="z-50 w-72 sm:w-80 glass-panel rounded-2xl p-4 shadow-2xl border border-sky-500/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl animate-fade-in text-slate-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{activePopover.term}</span>
            </div>
            <button
              onClick={() => setActivePopover(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Explanation / Question Action Button */}
          <div className="space-y-2">
            <button
              onClick={handleExecuteAsk}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-brand-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-md shadow-brand-500/20 transition-all text-left group"
            >
              <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.termExplanationPrompt}</p>
                <p className="text-[10px] text-white/80 truncate">{t.termAskInChat}</p>
              </div>
            </button>

            {/* Copy Button */}
            <button
              onClick={handleCopyTerm}
              className="w-full py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-500 font-semibold">{t.termCopied}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>{t.termCopy}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
