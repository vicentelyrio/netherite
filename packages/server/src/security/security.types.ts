export interface Policy {
  readonly token: string
  readonly port: () => number
  readonly origins: ReadonlyArray<string>
}

export const VerdictError = { Forbidden: 'Forbidden', Unauthorized: 'Unauthorized' } as const

export type Verdict =
  | { readonly ok: true }
  | {
      readonly ok: false
      readonly status: 401 | 403
      readonly error: (typeof VerdictError)[keyof typeof VerdictError]
      readonly message: string
    }

export interface GuardedRequest {
  readonly method: string
  readonly headers: Readonly<Record<string, string | undefined>>
}
