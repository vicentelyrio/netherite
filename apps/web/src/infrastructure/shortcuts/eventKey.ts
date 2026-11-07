type KeyLike = Pick<KeyboardEvent, 'key' | 'code' | 'altKey'>

const spelled: Record<string, string> = { ' ': 'space', '+': 'plus' }
const physical = /^(?:Key([A-Z])|Digit(\d))$/

// Option on a Mac turns the key into another character: Option+P is π, so read the key's position.
export const eventKey = ({ key, code, altKey }: KeyLike) => {
  const position = altKey ? physical.exec(code ?? '') : null
  if (position !== null) return (position[1] ?? position[2] ?? '').toLowerCase()
  const lower = key.toLowerCase()
  return spelled[lower] ?? lower
}

export const isSymbolKey = (key: string) => /^[^a-z0-9]$/.test(key)
