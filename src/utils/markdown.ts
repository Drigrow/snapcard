/**
 * Preprocess Markdown text to fix CommonMark CJK flanking delimiter issues,
 * multi-word bold spans, and quotes/brackets wrapping without breaking tables or lists.
 */
export function preprocessMarkdown(text: string): string {
  if (!text) return '';

  // 1. Normalize fullwidth markdown symbols
  let content = text
    .replace(/＊＊/g, '**')
    .replace(/～～/g, '~~')
    .replace(/｀｀｀/g, '```')
    .replace(/｀/g, '`');

  // Split by code blocks ``` ... ``` to protect code
  const codeParts = content.split(/(```[\s\S]*?```)/g);

  return codeParts
    .map((codePart, codeIdx) => {
      if (codeIdx % 2 === 1) return codePart;

      // Process line by line so bold spans don't accidentally leak across lines
      const lines = codePart.split('\n');

      const processedLines = lines.map((line) => {
        if (!line.includes('**')) return line;

        const parts = line.split('**');
        // If odd number of parts (i.e. even number of **), we have matched pairs of **
        if (parts.length % 2 === 1 && parts.length > 2) {
          for (let i = 1; i < parts.length; i += 2) {
            let inner = parts[i];

            // A. Move brackets/quotes outside if wrapped inside **
            // e.g. **「单向陷阱」** -> 「**单向陷阱**」, **“桌球”** -> “**桌球**”
            const bracketMatch = inner.match(/^([「“《（【(‘'"])([\s\S]+?)([」”》）】)’'"])$/);
            if (bracketMatch) {
              parts[i - 1] += bracketMatch[1];
              parts[i + 1] = bracketMatch[3] + parts[i + 1];
              inner = bracketMatch[2];
            }

            // B. Trim inner whitespace within ** ... **
            inner = inner.trim();

            // C. CommonMark flanking boundary spacing:
            // Ensure space before opening ** if preceded by non-space/non-delimiter/non-opening-bracket
            if (parts[i - 1] && /[^\s|>`#*_\-\d[(「“《（【‘'"]/.test(parts[i - 1].slice(-1))) {
              parts[i - 1] += ' ';
            }
            // Ensure space after closing ** if followed by non-space/non-delimiter/non-closing-bracket
            if (parts[i + 1] && /[^\s|>`#*_\-\d)\]」”》）】’'"]/.test(parts[i + 1].slice(0, 1))) {
              parts[i + 1] = ' ' + parts[i + 1];
            }

            parts[i] = inner;
          }

          return parts.join('**');
        }

        return line;
      });

      return processedLines.join('\n');
    })
    .join('');
}
