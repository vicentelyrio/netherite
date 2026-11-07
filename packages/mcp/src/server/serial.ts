export const makeSerial = () => {
  let queue: Promise<unknown> = Promise.resolve()
  return <A>(work: () => Promise<A>): Promise<A> => {
    const next = queue.then(work, work)
    queue = next.catch(() => undefined)
    return next
  }
}
