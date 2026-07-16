// scripts/social-generate/text-utils.mjs
// Görsel üzerine bindirilecek metinler için XML-güvenli kaçış ve kırpma yardımcıları.

const XML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

export function xmlEscape(text) {
  return String(text).replace(/[&<>"']/g, (ch) => XML_ESCAPES[ch]);
}

export function shortDescription(description, maxLen = 90) {
  const trimmed = description.trim();
  if (trimmed.length <= maxLen) return trimmed;

  const sentenceMatch = trimmed.match(new RegExp(`^(.{1,${maxLen}}?[.;])\\s`));
  if (sentenceMatch && sentenceMatch[1].length <= maxLen) {
    return sentenceMatch[1];
  }

  const slice = trimmed.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const cut = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${cut}…`;
}

export function wrapText(text, maxCharsPerLine) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxCharsPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}
