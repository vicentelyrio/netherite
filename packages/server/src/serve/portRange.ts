import { settingDefaults } from '@netherite/core'

const { port: defaultPort, portFallbackSpan, maxPort } = settingDefaults.server

export const portRange = (port: number | undefined, fallback: boolean | undefined) => {
  const first = port ?? defaultPort
  const last = fallback && first !== 0 ? Math.min(first + portFallbackSpan, maxPort) : first
  return { first, last }
}
