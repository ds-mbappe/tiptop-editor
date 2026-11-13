// The few places where the stored HTML depends on the Tiptap version the web
// runs. '3.22' is the output of tiptop-editor 2.3.x (Tiptap 3.22), the
// release most stored content was written with; '3.33' is this repo's Tiptap. The oracle tests run each
// flavour against the matching real editor.

import type { SchemaOptions } from '../spec'

export type TiptapFlavour = '3.22' | '3.33'

export const DEFAULT_FLAVOUR: TiptapFlavour = '3.22'

export interface HtmlOptions extends SchemaOptions {
  /** Which web editor to match. Default: '3.22' (tiptop-editor 2.3.x); '3.33' for this version. */
  tiptap?: TiptapFlavour
  /**
   * fromHTML only. Keep elements the web drops on load (RAW_TAGS) as
   * non-web rawBlock / rawInline nodes holding their exact source, which
   * toHTML writes back unchanged. Off by default, so fromHTML equals the web.
   */
  preserveUnknown?: boolean
}

export interface FlavourRules {
  /** Table cells: write colspan="1" / rowspan="1" (3.22) or leave them out (3.33). */
  omitDefaultCellSpans: boolean
  /** Highlight colour from style: as written (3.33) or as the browser normalises it, rgb() (3.22). */
  rawHighlightStyle: boolean
}

export function flavourRules(options: HtmlOptions = {}): FlavourRules {
  const next = (options.tiptap ?? DEFAULT_FLAVOUR) === '3.33'
  return { omitDefaultCellSpans: next, rawHighlightStyle: next }
}
