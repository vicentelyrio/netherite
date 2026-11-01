import { type FieldIssue, ValidationError } from '@netherite/core'

type Args = Record<string, unknown>

/**
 * Reads tool arguments. The MCP SDK passes whatever the agent sent, so each value is checked
 * here and every problem is collected, to be reported together as field-level errors.
 */
export class ArgReader {
  readonly issues: FieldIssue[] = []
  constructor(private readonly args: Args) {}

  private bad(name: string, message: string) {
    this.issues.push({ path: [name], message })
  }

  string(name: string, options: { required?: boolean; pattern?: RegExp } = {}): string | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) {
      if (options.required) this.bad(name, 'Required')
      return undefined
    }
    if (typeof value !== 'string' || value.trim() === '') {
      this.bad(name, 'Must be a non-empty string')
      return undefined
    }
    if (options.pattern && !options.pattern.test(value)) {
      this.bad(name, `Does not look right: ${value}`)
      return undefined
    }
    return value
  }

  id(name: string, required = true) {
    return this.string(name, { required, pattern: /^[A-Z]+-\d+$/ })
  }

  boolean(name: string): boolean | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'boolean') {
      this.bad(name, 'Must be true or false')
      return undefined
    }
    return value
  }

  integer(name: string, options: { min?: number; max?: number } = {}): number | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      this.bad(name, 'Must be a whole number')
      return undefined
    }
    if (
      (options.min !== undefined && value < options.min) ||
      (options.max !== undefined && value > options.max)
    ) {
      this.bad(name, `Must be between ${options.min ?? '-∞'} and ${options.max ?? '∞'}`)
      return undefined
    }
    return value
  }

  oneOf<T extends string>(
    name: string,
    choices: ReadonlyArray<T>,
    required = false,
  ): T | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) {
      if (required) this.bad(name, 'Required')
      return undefined
    }
    if (typeof value !== 'string' || !(choices as ReadonlyArray<string>).includes(value)) {
      this.bad(name, `Must be one of: ${choices.join(', ')}`)
      return undefined
    }
    return value as T
  }

  object(name: string): Record<string, unknown> | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) return undefined
    if (typeof value !== 'object' || Array.isArray(value)) {
      this.bad(name, 'Must be an object')
      return undefined
    }
    return value as Record<string, unknown>
  }

  strings(name: string): string[] | undefined {
    const value = this.args[name]
    if (value === undefined || value === null) return undefined
    if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
      this.bad(name, 'Must be a list of strings')
      return undefined
    }
    return value as string[]
  }

  raw(name: string): unknown {
    return this.args[name]
  }

  /** Fails with every problem found so far, if there are any. */
  check(): ValidationError | undefined {
    return this.issues.length === 0 ? undefined : new ValidationError({ issues: this.issues })
  }
}
