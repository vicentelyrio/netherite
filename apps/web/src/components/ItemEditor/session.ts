export interface Version {
  readonly text: string
  readonly hash: string
}

export interface Session {
  readonly base: Version
  readonly buffer: string
  readonly conflict: Version | undefined
}

export type SessionEvent =
  | { readonly type: 'edit'; readonly text: string }
  | { readonly type: 'remote'; readonly version: Version }
  | { readonly type: 'saved'; readonly version: Version }
  | { readonly type: 'reload' }
  | { readonly type: 'keep-mine' }

export const startSession = (version: Version): Session => ({
  base: version,
  buffer: version.text,
  conflict: undefined,
})

export const isDirty = (s: Session) => s.buffer !== s.base.text

export const reduce = (s: Session, event: SessionEvent): Session => {
  switch (event.type) {
    case 'edit':
      return { ...s, buffer: event.text }
    case 'remote': {
      const { version } = event
      if (version.hash === s.base.hash)
        return s.conflict === undefined ? s : { ...s, conflict: undefined }
      if (s.conflict?.hash === version.hash) return s
      if (version.text === s.base.text) return { ...s, base: version }
      if (!isDirty(s)) return { base: version, buffer: version.text, conflict: undefined }
      if (version.text === s.buffer) return { base: version, buffer: s.buffer, conflict: undefined }
      return { ...s, conflict: version }
    }
    case 'saved':
      return { base: event.version, buffer: s.buffer, conflict: undefined }
    case 'reload':
      return s.conflict === undefined
        ? { base: s.base, buffer: s.base.text, conflict: undefined }
        : { base: s.conflict, buffer: s.conflict.text, conflict: undefined }
    case 'keep-mine':
      return s.conflict === undefined
        ? s
        : {
            base: { text: s.conflict.text, hash: s.conflict.hash },
            buffer: s.buffer,
            conflict: undefined,
          }
  }
}
