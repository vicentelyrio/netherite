export const initialsOf = (name: string) => {
  const words = name
    .replace(/^@/, '')
    .split(/[\s._-]+/)
    .filter((w) => w !== '')
  const letters =
    words.length > 1
      ? `${words[0]?.[0] ?? ''}${words.at(-1)?.[0] ?? ''}`
      : (words[0] ?? '').slice(0, 2)
  return letters.toUpperCase()
}
