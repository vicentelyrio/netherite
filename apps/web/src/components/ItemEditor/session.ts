/** A version of the file: its text and the hash the server knows it by. */
export interface Version {
  readonly text: string
  readonly hash: string
}

/**
 * What an open editor knows. `base` is the version the buffer started from (and is saved over);
 * `conflict` is a newer version found on disk while the buffer had changes of its own.
 */
export interface Session {
  readonly base: Version
  readonly buffer: string
  readonly conflict: Version | undefined
}

export type SessionEvent =
  /** Something typed: the buffer is now this. */
  | { readonly type: 'edit'; readonly text: string }
  /** The server reports the file as it is now. */
  | { readonly type: 'remote'; readonly version: Version }
  /** A save went through: the buffer is the file. */
  | { readonly type: 'saved'; readonly version: Version }
  /** Throw the buffer away and take what is on disk. */
  | { readonly type: 'reload' }
  /** Keep the buffer, and save over the newer version. */
  | { readonly type: 'keep-mine' }

export const startSession = (version: Version): Session => ({
  base: version,
  buffer: version.text,
  conflict: undefined,
})

export const isDirty = (s: Session) => s.buffer !== s.base.text

/**
 * "Changed on disk" (TASK-00036). A new version of the file arrives:
 * - if the buffer has no changes of its own, it just follows the file, silently;
 * - if it has, nothing is lost and nothing is overwritten: the newer version is held as a
 *   `conflict`, and the person chooses to reload (drop their changes) or keep them (and save over).
 * A version the editor already has, or an older one it is being told about late, changes nothing.
 */
export const reduce = (s: Session, event: SessionEvent): Session => {
  switch (event.type) {
    case 'edit':
      return { ...s, buffer: event.text }
    case 'remote': {
      const { version } = event
      if (version.hash === s.base.hash)
        return s.conflict === undefined ? s : { ...s, conflict: undefined }
      if (s.conflict?.hash === version.hash) return s
      // The same text under a new hash is not a change to anyone.
      if (version.text === s.base.text) return { ...s, base: version }
      if (!isDirty(s)) return { base: version, buffer: version.text, conflict: undefined }
      // The file now says what the buffer says: nothing to decide.
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
