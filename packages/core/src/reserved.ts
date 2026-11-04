/**
 * Folders at the top of the content root that hold no items: files for the items (`assets/`) and
 * the workspace's own starter templates (`templates/`).
 */
export const reservedFolders: ReadonlyArray<string> = ['assets', 'templates']

/** Whether a path inside the content root (with `/` separators) is in a folder without items. */
export const inReservedFolder = (inside: string) =>
  reservedFolders.includes(inside.split('/')[0] ?? '')
