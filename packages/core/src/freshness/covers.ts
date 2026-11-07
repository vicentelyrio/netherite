import picomatch from 'picomatch'

const globChars = /[*?[\]{}()!]/

const normalizeGlob = (pattern: string) =>
  pattern.trim().replace(/^\.\//, '').replace(/^\/+/, '').replace(/\/+$/, '')

export const compileCovers = (patterns: ReadonlyArray<string>): ((path: string) => boolean) => {
  const include: string[] = []
  const exclude: string[] = []
  for (const raw of patterns) {
    const negated = raw.trim().startsWith('!')
    const pattern = normalizeGlob(negated ? raw.trim().slice(1) : raw)
    if (pattern === '') continue
    const list = negated ? exclude : include
    if (globChars.test(pattern)) list.push(pattern)
    else list.push(pattern, `${pattern}/**`)
  }
  if (include.length === 0) return () => false
  const yes = picomatch(include, { dot: true })
  const no = exclude.length > 0 ? picomatch(exclude, { dot: true }) : undefined
  return (path) => yes(path) && !(no?.(path) ?? false)
}
