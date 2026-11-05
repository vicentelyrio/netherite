export const reservedFolders: ReadonlyArray<string> = ['assets', 'templates']

export const inReservedFolder = (inside: string) =>
  reservedFolders.includes(inside.split('/')[0] ?? '')
