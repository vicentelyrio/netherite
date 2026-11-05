const key = 'netherite:last-project'

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
