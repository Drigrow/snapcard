import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { getTranslation, Language } from '../utils/i18n';

interface MermaidViewerProps {
  chart: string;
  theme?: 'dark' | 'light';
  title?: string;
  lang?: Language;
}

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, theme = 'dark', title, lang = 'zh' }) => {
  const t = getTranslation(lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgContent, setSvgContent] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: theme === 'dark' ? 'dark' : 'neutral',
        securityLevel: 'loose',
        fontFamily: 'Inter, sans-serif',
        themeVariables: {
          primaryColor: '#0e8ceb',
          primaryTextColor: '#ffffff',
          primaryBorderColor: '#38a9f8',
          lineColor: '#7cc7fb',
          secondaryColor: '#1e293b',
          tertiaryColor: '#0f172a',
        },
      });

      const id = `mermaid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      mermaid
        .render(id, chart)
        .then(({ svg }) => {
          if (isMounted) {
            setSvgContent(svg);
          }
        })
        .catch((err) => {
          console.warn('[Mermaid render warning]', err);
          if (isMounted) setHasError(true);
        });
    } catch (e) {
      console.warn('[Mermaid init error]', e);
      setHasError(true);
    }

    return () => {
      isMounted = false;
    };
  }, [chart, theme]);

  if (hasError || !svgContent) {
    return null; // Gracefully hide if invalid syntax
  }

  return (
    <div className={`my-3 sm:my-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 sm:p-4 transition-all relative overflow-hidden ${
      isExpanded ? 'fixed inset-2 sm:inset-4 z-50 bg-white/95 dark:bg-slate-950/95 flex flex-col backdrop-blur-xl shadow-2xl p-3.5 sm:p-6' : ''
    }`}>
      {/* Header bar */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-200/80 dark:border-slate-800/80 mb-2.5 sm:mb-3 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 truncate pr-2">
          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
          <span className="truncate">{title || t.diagramDefaultTitle}</span>
        </span>

        {/* Controls */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
            title={t.zoomIn}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
            title={t.zoomOut}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white"
            title={t.resetZoom}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-slate-500 hover:text-slate-800 dark:hover:text-white ml-0.5"
            title={isExpanded ? t.minimize : t.expand}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Container with zoom */}
      <div
        ref={containerRef}
        className={`flex items-center justify-center overflow-x-auto scrollbar-none transition-transform duration-150 touch-pan-x touch-pan-y ${
          isExpanded ? 'flex-1 p-2 sm:p-4' : 'min-h-[140px] max-h-[380px] sm:max-h-[420px]'
        }`}
      >
        <div
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
          className="w-full flex justify-center [&>svg]:max-w-full [&>svg]:h-auto"
        />
      </div>
    </div>
  );
};
