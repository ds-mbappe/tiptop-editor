// Mobile-only nodes for HTML the web editor has no rule for (legacy <img>,
// <iframe>, h4–h6…). fromHTML() keeps such an element as one of these, with
// its original markup, and toHTML() writes that markup back unchanged at the
// same place. They never reach the web as JSON: the web only ever sees the
// HTML, exactly as it was before.

export const RAW_BLOCK = 'rawBlock'
export const RAW_INLINE = 'rawInline'

export const isRawType = (type: string): boolean => type === RAW_BLOCK || type === RAW_INLINE

/**
 * Elements the web editor has no rule for and drops entirely when it loads a
 * note (measured: legacy <img>, YouTube <iframe>). With `preserveUnknown`,
 * fromHTML keeps each as a raw node holding its exact source markup.
 */
export const RAW_TAGS = ['img', 'iframe', 'video', 'audio', 'embed', 'object', 'svg', 'canvas', 'picture'] as const
