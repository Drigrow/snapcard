import React, { useState } from 'react';
import { X, Key, Check, ShieldCheck, AlertCircle, Save, Sparkles, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { ApiService } from '../services/api';
import { getTranslation, Language } from '../utils/i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  lang: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  lang,
}) => {
  const t = getTranslation(lang);
  const [openRouterKey, setOpenRouterKey] = useState(settings.openRouterKey);
  const [tavilyKey, setTavilyKey] = useState(settings.tavilyKey);
  const [model, setModel] = useState(settings.model || 'google/gemini-2.5-flash');
  const [imageModel, setImageModel] = useState(settings.imageModel || 'google/gemini-2.5-flash-image');

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    openRouter?: { valid: boolean; message: string };
    tavily?: { valid: boolean; message: string };
  } | null>(null);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      openRouterKey: openRouterKey.trim(),
      tavilyKey: tavilyKey.trim(),
      model,
      imageModel,
    });
    onClose();
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await ApiService.verifySettings(openRouterKey.trim(), tavilyKey.trim());
      setVerifyResult(res);
    } catch (err: any) {
      console.error('Verify error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-slate-800/80 mb-4 sm:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              {t.settingsTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form (Scrollable) */}
        <div className="space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto pr-1">
          
          {/* OpenRouter Key */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {t.openRouterKeyLabel}
            </label>
            <input
              type="password"
              value={openRouterKey}
              onChange={(e) => setOpenRouterKey(e.target.value)}
              placeholder="sk-or-v1-..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 sm:py-2.5 outline-none focus:border-brand-500 font-mono text-xs transition-colors"
            />
            <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1">{t.openRouterKeyDesc}</p>
          </div>

          {/* Model Selector (1 col on mobile, 2 col on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {t.modelLabel}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-brand-500 text-xs"
              >
                <option value="google/gemini-3.7-flash">Gemini 3.7 Flash (Default)</option>
                <option value="google/gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                {t.imageModelLabel}
              </label>
              <select
                value={imageModel}
                onChange={(e) => setImageModel(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 outline-none focus:border-brand-500 text-xs"
              >
                <option value="google/gemini-3.1-flash-lite-image">Gemini 3.1 Flash Lite Image (Default)</option>
                <option value="google/gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                <option value="openai/dall-e-3">DALL-E 3</option>
              </select>
            </div>
          </div>

          {/* Tavily Key */}
          <div>
            <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {t.tavilyKeyLabel}
            </label>
            <input
              type="password"
              value={tavilyKey}
              onChange={(e) => setTavilyKey(e.target.value)}
              placeholder="tvly-..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 outline-none focus:border-brand-500 font-mono text-xs transition-colors"
            />
            <p className="text-[11px] text-slate-400 mt-1">{t.tavilyKeyDesc}</p>
          </div>

          {/* Verify results badge */}
          {verifyResult && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
              {verifyResult.openRouter && (
                <div className="flex items-center gap-2">
                  {verifyResult.openRouter.valid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="truncate">OpenRouter: {verifyResult.openRouter.message}</span>
                </div>
              )}
              {verifyResult.tavily && (
                <div className="flex items-center gap-2">
                  {verifyResult.tavily.valid ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  )}
                  <span className="truncate">Tavily: {verifyResult.tavily.message}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying || (!openRouterKey && !tavilyKey)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
          >
            {isVerifying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
            )}
            <span>{t.verifyApi}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-brand-500/25 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{t.saveSettings}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
