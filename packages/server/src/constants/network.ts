import { settingDefaults } from '@netherite/core'

export const loopbackHost = settingDefaults.server.host

export const loopbackNames = [loopbackHost, 'localhost', '[::1]'] as const

export const bareLoopbackNames: ReadonlySet<string> = new Set(['localhost', '::1', '[::1]'])

export const loopbackPattern = /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/

export const urlOf = (host: string, port: number) => `http://${host}:${port}`

export const addressInUse = 'EADDRINUSE'

export const tokenBytes = 32

export const bearerPrefix = 'Bearer '
