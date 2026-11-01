import { createHash } from 'node:crypto'

/** The hash an edit is based on: SHA-256 of the file's text, in hex. */
export const contentHash = (text: string) => createHash('sha256').update(text).digest('hex')
