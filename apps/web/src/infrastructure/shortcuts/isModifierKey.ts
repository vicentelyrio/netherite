const modifierKeys = new Set(['shift', 'control', 'alt', 'meta', 'altgraph', 'capslock', 'fn'])

export const isModifierKey = (key: string) => modifierKeys.has(key.toLowerCase())
