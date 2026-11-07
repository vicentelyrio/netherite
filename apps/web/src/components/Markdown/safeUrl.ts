export const safeUrl = (
  url: string | undefined,
): { href: string; external: boolean } | undefined => {
  if (url === undefined || url === '') return undefined
  const trimmed = url.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//'))
    return { href: trimmed, external: false }
  if (trimmed.startsWith('#')) return { href: trimmed, external: false }
  try {
    const parsed = new URL(trimmed)
    if (
      parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:'
    ) {
      return { href: parsed.href, external: parsed.protocol !== 'mailto:' }
    }
  } catch {}
  return undefined
}
