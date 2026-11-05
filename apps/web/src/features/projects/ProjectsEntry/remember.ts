const key = 'netherite:last-project'

/** The project board you looked at last, kept for the Projects item in the rail. */
export const rememberProject = (id: string) => {
  try {
    localStorage.setItem(key, id)
  } catch {}
}

export const lastProject = () => {
  try {
    return localStorage.getItem(key) ?? undefined
  } catch {
    return undefined
  }
}
