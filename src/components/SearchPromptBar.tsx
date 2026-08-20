import React, { useState, useRef } from 'react';
import { Sparkles, Camera, X, Zap } from 'lucide-react';
import { AudienceTier } from '../types';
import { getTranslation, Language } from '../utils/i18n';
import { ApiService } from '../services/api';

interface SearchPromptBarProps {
  lang: Language;
  onGenerate: (params: {
    query: string;
    audience: AudienceTier;
    needImage: boolean;
    photoUrl?: string;
  }) => void;
  isLoading: boolean;
}

export const SearchPromptBar: React.FC<SearchPromptBarProps> = ({
  lang,
  onGenerate,
  isLoading,
}) => {
  const t = getTranslation(lang);
  const [query, setQuery] = useState('');
  const [audience, setAudience] = useState<AudienceTier>('general');
  const [needImage, setNeedImage] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inspirationQueries = lang === 'zh' ? [
    '量子纠缠原理',
    'CRISPR 基因编辑',
    '光刻机 EUV 极紫外光技术',
    'Transformer 注意力机制',
    '核聚变可控托卡马克',
    '黑神话悟空背后的虚幻5引擎技术',
  ] : [
    'Quantum Entanglement',
    'CRISPR Gene Editing',
    'EUV Lithography Machine',
    'Transformer Attention Mechanism',
    'Nuclear Fusion & Tokamak',
    'SpaceX Starship Reusability',
  ];

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview first
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      setIsUploading(true);
      const uploadedUrl = await ApiService.uploadPhoto(file);
      setPhotoPreview(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload photo:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearPhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!query.trim() && !photoPreview) || isLoading || isUploading) return;

    onGenerate({
      query: query.trim() || t.photoQueryFallback,
      audience,
      needImage,
      photoUrl: photoPreview || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4">
      {/* Container Box */}
      <div className="glass-panel rounded-2xl sm:rounded-3xl p-3 sm:p-5 shadow-xl sm:shadow-2xl transition-all border border-slate-200/80 dark:border-slate-800/80 hover:border-brand-500/40 dark:hover:border-brand-500/40 relative">
        
        {/* Photo preview pill if uploaded */}
        {photoPreview && (
          <div className="mb-3 flex items-center gap-2 p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl w-fit">
            <img
              src={photoPreview}
              alt="Upload preview"
              className="w-10 h-10 rounded-lg object-cover border border-brand-500/30"
            />
            <div className="text-xs">
              <p className="font-semibold text-brand-600 dark:text-brand-400">{t.photoUploaded}</p>
              <p className="text-slate-500 text-[10px]">{t.photoTip}</p>
            </div>
            <button
              onClick={handleClearPhoto}
              className="p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Text Area */}
        <div className="relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t.searchPlaceholder}
            rows={2}
            className="w-full bg-transparent resize-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs sm:text-base font-normal leading-relaxed pr-20 sm:pr-24 py-1"
          />

          {/* Action Button inside right */}
          <div className="absolute right-0 bottom-1 sm:bottom-2 flex items-center gap-1 sm:gap-1.5">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={t.photoUpload}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-brand-500 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            >
              <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={() => handleSubmit()}
              disabled={(!query.trim() && !photoPreview) || isLoading || isUploading}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1 sm:gap-1.5 shadow-md shadow-brand-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all transform active:scale-95 shrink-0"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{t.generateBtn}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom Options Bar: Audience & Image Mode */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
          
          {/* Audience selector */}
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
            <span className="text-slate-500 font-medium text-[11px] sm:text-xs shrink-0">{t.audienceLabel}:</span>
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800">
              {(
                [
                  { id: 'student', label: t.audienceStudent, desc: t.audienceStudentDesc },
                  { id: 'general', label: t.audienceGeneral, desc: t.audienceGeneralDesc },
                  { id: 'expert', label: t.audienceExpert, desc: t.audienceExpertDesc },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAudience(item.id)}
                  title={item.desc}
                  className={`px-2 sm:px-2.5 py-1 rounded-md transition-all font-medium text-[11px] sm:text-xs ${
                    audience === item.id
                      ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Mode Switch */}
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2">
            <span className="text-slate-500 font-medium text-[11px] sm:text-xs shrink-0">{t.imageModeLabel}:</span>
            <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setNeedImage(false)}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                  !needImage
                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.imageModeNo}
              </button>
              <button
                type="button"
                onClick={() => setNeedImage(true)}
                className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-[11px] sm:text-xs ${
                  needImage
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm font-semibold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {t.imageModeYes}
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Quick Inspiration Chips (Smooth horizontal scroll on mobile) */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs touch-pan-x scrollbar-none">
        <span className="text-slate-500 whitespace-nowrap flex items-center gap-1 font-medium shrink-0 text-[11px] sm:text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          {t.inspirationTitle}:
        </span>
        <div className="flex items-center gap-1.5 flex-nowrap">
          {inspirationQueries.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuery(item);
                onGenerate({
                  query: item,
                  audience,
                  needImage,
                });
              }}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-900/80 hover:bg-brand-500/10 text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 border border-slate-200/60 dark:border-slate-800 hover:border-brand-500/30 whitespace-nowrap transition-all text-[11px] sm:text-xs"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
