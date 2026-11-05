export const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s/g, '-')

export const uniqueSlugs = (texts: ReadonlyArray<string>) => {
  const seen = new Map<string, number>()
  return texts.map((text) => {
    const slug = slugify(text)
    const count = seen.get(slug) ?? 0
    seen.set(slug, count + 1)
    return count === 0 ? slug : `${slug}-${count}`
  })
}
