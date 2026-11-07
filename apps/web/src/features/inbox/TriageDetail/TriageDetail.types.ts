import type { Effect } from 'effect'
import type { Client } from '@/infrastructure/api'

export const captureTypes = ['task', 'doc', 'adr', 'runbook', 'context'] as const
export type CaptureType = (typeof captureTypes)[number]

export type Act = (client: Client) => Effect.Effect<unknown, unknown>
