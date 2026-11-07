export const isMacPlatform = () => {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  return /mac|iphone|ipad/i.test(nav.userAgentData?.platform ?? navigator.platform ?? '')
}
