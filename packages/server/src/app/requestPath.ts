import { AppPath } from '../constants'

const unsafe = (pathname: string) =>
  pathname.includes('\0') ||
  pathname.includes('\\') ||
  pathname.split('/').includes(AppPath.ParentSegment)

export const requestPath = (url: string): string | undefined => {
  try {
    const pathname = decodeURIComponent(new URL(url, AppPath.ParseBase).pathname)
    return unsafe(pathname) ? undefined : pathname
  } catch {
    return undefined
  }
}

export const isApiPath = (pathname: string) =>
  pathname === AppPath.Api || pathname.startsWith(AppPath.ApiPrefix)
