/**
 * Preprocess Markdown text to fix CommonMark CJK flanking delimiter issues,
 * multi-line bold spans, bullet symbols, fullwidth punctuation, and LLM spacing anomalies within **.
 */
export function preprocessMarkdown(text: string): string {
  if (!text) return '';

  // 1. Normalize fullwidth markdown symbols
  let content = text
    .replace(/＊＊/g, '**')
    .replace(/～～/g, '~~')
    .replace(/｀｀｀/g, '```')
    .replace(/｀/g, '`');

  // 2. Fix inline dashed sub-items like "（RNP）： -PAM 识别... -R-loop 形成..." -> separate lines
  content = content.replace(/([：:])\s*-(?=[^\s\d])/g, '$1\n- ');
  content = content.replace(/([。；])\s*-([^\s\d])/g, '$1\n- $2');

  // 3. Convert raw bullet points (•, ·, ⁃) at line starts to standard markdown '- '
  content = content.replace(/(^|\n)[ \t]*[•·⁃][ \t]+/g, '$1- ');

  // Split by code blocks ``` ... ``` to protect raw code snippets
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts
    .map((part, index) => {
      // If code block part, leave untouched
      if (index % 2 === 1) return part;

      let p = part;

      // 4. Trim inner whitespace within ** ... ** on the same line
      // Handles multi-word phrases like "** 基因敲除 (Knockout) **", "**（单向导 RNA）与Cas9 核酸内切酶**"
      p = p.replace(/\*\*([^\n*]+?)\*\*/g, (match, inner) => {
        const trimmed = inner.trim();
        if (!trimmed) return '';
        return `**${trimmed}**`;
      });

      // 5. Ensure bold markers have boundary spaces before and after
      p = p.replace(/([^\s*`_#>\-\d([])(\*\*[^\n*]+?\*\*)/g, '$1 $2');
      p = p.replace(/(\*\*[^\n*]+?\*\*)([^\s*`_#<:\d])/g, '$1 $2');

      return p;
    })
    .join('');
}
