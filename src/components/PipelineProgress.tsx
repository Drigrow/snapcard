import React from 'react';
import { PipelineStatus } from '../types';
import { getTranslation, Language } from '../utils/i18n';
import { Compass, Globe, Palette, FileText, CheckCircle2 } from 'lucide-react';

interface PipelineProgressProps {
  status: PipelineStatus | null;
  lang: Language;
}

export const PipelineProgress: React.FC<PipelineProgressProps> = ({ status, lang }) => {
  const t = getTranslation(lang);

  if (!status) return null;

  const steps = [
    { id: 'intent', label: t.stepIntent, icon: Compass },
    { id: 'search', label: t.stepSearch, icon: Globe },
    { id: 'image_gen', label: t.stepImageGen, icon: Palette },
    { id: 'synthesis', label: t.stepSynthesis, icon: FileText },
  ];

  const currentStepIndex = (status.stepNumber || 1) - 1;

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4 animate-fade-in">
      <div className="glass-panel rounded-2xl p-4 sm:p-5 shadow-lg border border-brand-500/30 relative overflow-hidden">
        
        {/* Glowing top line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500 animate-shimmer" />

        {/* Current status message */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-brand-500 animate-ping" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {status.message || t.generating}
          </p>
        </div>

        {/* Stepper nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div
                key={step.id}
                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                  isCurrent
                    ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                    : isDone
                    ? 'bg-slate-100/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    : 'bg-transparent border-slate-200/40 dark:border-slate-800/40 text-slate-400 opacity-60'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : (
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'animate-bounce text-brand-500' : ''}`} />
                )}
                <span className="text-xs truncate">{step.label}</span>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
