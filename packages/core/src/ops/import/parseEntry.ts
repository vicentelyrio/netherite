import type { Json } from '../../edit'
import { type ImportType, importTypes, type Parsed } from './import.types'

const reserved = ['id', 'type', 'aliases', 'title', 'created', 'source', 'imported_at']

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const parseEntry = (raw: unknown, defaultMode: 'copy' | 'move'): Parsed => {
  if (!isObject(raw)) return { problem: 'An entry is an object with a source and a type' }
  const { source, type, title, id, fields, body, mode } = raw
  if (typeof source !== 'string' || source.trim() === '') {
    return { problem: '`source` is a path in the repository or a URL' }
  }
  if (typeof type !== 'string' || !(importTypes as ReadonlyArray<string>).includes(type)) {
    return { problem: `\`type\` is one of ${importTypes.join(', ')}` }
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return { problem: '`title` is a non-empty string' }
  }
  if (id !== undefined && typeof id !== 'string') return { problem: '`id` is a string' }
  if (body !== undefined && typeof body !== 'string') return { problem: '`body` is a string' }
  if (mode !== undefined && mode !== 'copy' && mode !== 'move') {
    return { problem: '`mode` is copy or move' }
  }
  if (fields !== undefined && !isObject(fields)) return { problem: '`fields` is an object' }
  const clash = Object.keys(fields ?? {}).filter((f) => reserved.includes(f))
  if (clash.length > 0) {
    return { problem: `${clash.map((f) => `\`${f}\``).join(', ')} are set by the import itself` }
  }
  return {
    entry: {
      source: source.trim(),
      type: type as ImportType,
      ...(title === undefined ? {} : { title: (title as string).trim() }),
      ...(id === undefined ? {} : { id: id as string }),
      ...(fields === undefined ? {} : { fields: fields as Record<string, Json> }),
      ...(body === undefined ? {} : { body: body as string }),
      mode: (mode as 'copy' | 'move' | undefined) ?? defaultMode,
    },
  }
}
