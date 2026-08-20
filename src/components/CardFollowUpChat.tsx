import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Bot, User, Sparkles } from 'lucide-react';
import { CardRecord, CardMessage, AppSettings } from '../types';
import { ApiService } from '../services/api';
import { getTranslation, Language } from '../utils/i18n';
import { InteractiveMarkdown } from './InteractiveMarkdown';

interface CardFollowUpChatProps {
  card: CardRecord | null;
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  settings: AppSettings;
  initialQuestion?: string | null;
  onClearInitialQuestion?: () => void;
}

export const CardFollowUpChat: React.FC<CardFollowUpChatProps> = ({
  card,
  isOpen,
  onClose,
  lang,
  settings,
  initialQuestion,
  onClearInitialQuestion,
}) => {
  const t = getTranslation(lang);
  const [messages, setMessages] = useState<CardMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasTriggeredInitialRef = useRef(false);

  useEffect(() => {
    if (card && isOpen) {
      hasTriggeredInitialRef.current = false;
      // Load previous follow-up messages for this specific card
      ApiService.getCardById(card.id)
        .then((res) => {
          setMessages(res.messages || []);
        })
        .catch((err) => console.error('Failed to load card messages:', err));
    }
  }, [card?.id, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendQuery = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || !card || isLoading) return;

    setInput('');
    const tempUserMsg: CardMessage = {
      id: `temp_${Date.now()}`,
      cardId: card.id,
      role: 'user',
      content: q,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const answer = await ApiService.askFollowUp(card.id, q, settings);
      const assistantMsg: CardMessage = {
        id: `msg_${Date.now()}`,
        cardId: card.id,
        role: 'assistant',
        content: answer,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Follow-up error:', err);
      const errMsg: CardMessage = {
        id: `err_${Date.now()}`,
        cardId: card.id,
        role: 'assistant',
        content: t.followUpError,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-send initial question if provided (e.g. from clicking a blue term)
  useEffect(() => {
    if (isOpen && card && initialQuestion && !hasTriggeredInitialRef.current) {
      hasTriggeredInitialRef.current = true;
      sendQuery(initialQuestion);
      if (onClearInitialQuestion) {
        onClearInitialQuestion();
      }
    }
  }, [isOpen, card, initialQuestion]);

  if (!isOpen || !card) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendQuery(input);
  };

  const handleAskNestedTerm = (term: string) => {
    const nestedQuestion = `${t.termQueryPrefix}${term}${t.termQuerySuffix}`;
    sendQuery(nestedQuestion);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-2xl h-[85vh] rounded-3xl flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                {t.followUpTitle}
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md">
                {card.title} ({card.audience})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Card Context Preview */}
          <div className="p-3.5 rounded-2xl bg-brand-500/5 border border-brand-500/15 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-brand-600 dark:text-brand-400">{t.followUpContextLabel}</span>
            {card.oneLiner || card.title}
          </div>

          {messages.length === 0 && (
            <div className="text-center py-10 text-slate-400 text-xs sm:text-sm">
              {t.followUpEmptyHint}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none'
                    : 'glass-panel text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="markdown-body">
                    <InteractiveMarkdown
                      content={msg.content}
                      lang={lang}
                      onAskTerm={handleAskNestedTerm}
                    />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="glass-panel px-4 py-3 rounded-2xl rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
                {t.followUpThinking}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <form
          onSubmit={handleSend}
          className="p-3 sm:p-4 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t.followUpPlaceholder}
            className="flex-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 text-xs sm:text-sm outline-none focus:border-brand-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white disabled:opacity-40 transition-all shadow-md shadow-brand-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
