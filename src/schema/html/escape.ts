// HTML escaping as a browser serialises the DOM (innerHTML).

export function escapeText(text: string): string {
  return text.replace(/[&<>\u00a0]/g, ch =>
    ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&nbsp;')
}

export function escapeAttr(value: string): string {
  // Browsers since 2025 also escape < and > in attributes; older ones do not.
  // Both forms parse back to the same value.
  return value.replace(/[&"<>\u00a0]/g, ch =>
    ch === '&' ? '&amp;' : ch === '"' ? '&quot;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : '&nbsp;')
}
