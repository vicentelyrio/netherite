import { bareLoopbackNames, loopbackNames, loopbackPattern } from '../constants'

export const allowedHosts = (port: number) => loopbackNames.map((name) => `${name}:${port}`)

export const allowedOrigins = (port: number) => allowedHosts(port).map((host) => `http://${host}`)

export const isLoopbackHost = (host: string) =>
  bareLoopbackNames.has(host) || loopbackPattern.test(host)
