const itemId = /^[A-Z]{2,8}-\d{3,}$/

export const wikiHref = (target: string) =>
  itemId.test(target)
    ? `/items/${encodeURIComponent(target)}`
    : `/knowledge?q=${encodeURIComponent(target)}`
