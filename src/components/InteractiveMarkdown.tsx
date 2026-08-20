import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Language } from '../utils/i18n';
import { preprocessMarkdown } from '../utils/markdown';

interface InteractiveMarkdownProps {
  content: string;
  lang?: Language;
  onAskTerm?: (term: string) => void;
  className?: string;
}

export const InteractiveMarkdown: React.FC<InteractiveMarkdownProps> = ({
  content,
  className = '',
}) => {
  const processedContent = preprocessMarkdown(content);

  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-bold text-slate-900 dark:text-white">
              {children}
            </strong>
          ),
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};
