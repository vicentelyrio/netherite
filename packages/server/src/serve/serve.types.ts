import type { Layer } from 'effect'
import type { HttpRouter } from 'effect/http'

export interface ListenOptions {
  readonly host?: string
  readonly port?: number
  readonly fallback?: boolean
  readonly appRoot?: string | undefined
  readonly routes?: Layer.Layer<never, never, HttpRouter.HttpRouter>
}

export interface Running {
  readonly url: string
  readonly port: number
  readonly token: string
}
