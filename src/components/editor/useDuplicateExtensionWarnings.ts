import type { Extensions } from '@tiptap/core'
import { useEffect, useMemo, useRef } from 'react'

const getDuplicateExtensionNames = (baseExtensions: Extensions, extraExtensions: Extensions) => {
  const baseExtensionNames = new Set(baseExtensions.map(extension => extension.name))

  return Array.from(new Set(
    extraExtensions
      .map(extension => extension.name)
      .filter(name => baseExtensionNames.has(name))
  ))
}

export const useDuplicateExtensionWarnings = (
  baseExtensions: Extensions,
  extraExtensions: Extensions,
) => {
  const lastWarningSignatureRef = useRef<string | null>(null)

  const duplicateExtensionNames = useMemo(
    () => getDuplicateExtensionNames(baseExtensions, extraExtensions),
    [baseExtensions, extraExtensions]
  )

  const warningSignature = duplicateExtensionNames.join(',')

  useEffect(() => {
    if (!duplicateExtensionNames.length) {
      lastWarningSignatureRef.current = null
      return
    }

    if (lastWarningSignatureRef.current === warningSignature) {
      return
    }

    lastWarningSignatureRef.current = warningSignature

    const quotedNames = duplicateExtensionNames.map(name => `'${name}'`).join(', ')
    const message = `Duplicate extension names found in extraExtensions: [${quotedNames}]. extraExtensions is additive only; duplicate names can cause unstable behavior.`

    console.warn(`[tiptop-editor warn]: ${message}`)
  }, [duplicateExtensionNames, warningSignature])
}
