const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'em',
  'h2',
  'h3',
  'i',
  'li',
  'ol',
  'p',
  'strong',
  'u',
  'ul',
]);

const isSafeHref = (href) => /^(https?:|mailto:|#|\/)/i.test(href.trim());

export const sanitizeRichText = (content) => {
  if (!content) {
    return '';
  }

  return content
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?([a-z][\w-]*)\b[^>]*>/gi, (tag, tagName) => {
      const name = tagName.toLowerCase();

      if (!ALLOWED_TAGS.has(name)) {
        return '';
      }

      if (tag.startsWith('</')) {
        return `</${name}>`;
      }

      if (name !== 'a') {
        return `<${name}>`;
      }

      const href = tag.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const hrefValue = href?.[1] ?? href?.[2] ?? href?.[3] ?? '';

      return isSafeHref(hrefValue)
        ? `<a href="${hrefValue.replace(/"/g, '&quot;')}" rel="noopener noreferrer" target="_blank">`
        : '<a>';
    })
    .trim();
};
