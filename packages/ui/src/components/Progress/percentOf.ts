export const percentOf = (done: number, total: number) =>
  total <= 0 ? 0 : Math.max(0, Math.min(100, Math.round((done / total) * 100)))
