// Tiptap's link isAllowedUri (@tiptap/extension-link), default protocols.
// A link whose href fails it is written with href="" and not parsed back.

const PROTOCOLS = ['http', 'https', 'ftp', 'ftps', 'mailto', 'tel', 'callto', 'sms', 'cid', 'xmpp']
const WHITESPACE = new RegExp('[\\u0000-\\u0020\\u00A0\\u1680\\u180E\\u2000-\\u2029\\u205F\\u3000]', 'g')
const ALLOWED = new RegExp(`^(?:(?:${PROTOCOLS.join('|')}):|[^a-z]|[a-z0-9+.\\-]+(?:[^a-z+.\\-:]|$))`, 'i')

export function isAllowedUri(uri: string | null | undefined): boolean {
  return !uri || ALLOWED.test(uri.replace(WHITESPACE, ''))
}
