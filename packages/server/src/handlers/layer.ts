import { NetheriteApi } from '@netherite/api'
import { Layer } from 'effect'
import { HttpApiBuilder } from 'effect/http-api'
import type { ServerState } from '../state'
import { config } from './config'
import { events } from './events'
import { goals } from './goals'
import { graph } from './graph'
import { history } from './history'
import { inbox } from './inbox'
import { items } from './items'
import { knowledge } from './knowledge'
import { lintGroup, lintTextGroup } from './lint'
import { meta } from './meta'
import { projects } from './projects'
import { search } from './search'
import { stats } from './stats'
import { tags } from './tags'
import { timeline } from './timeline'

export const handlersLayer = (state: ServerState) =>
  Layer.mergeAll(
    items(state),
    search(state),
    graph(state),
    goals(state),
    projects(state),
    knowledge(state),
    tags(state),
    lintGroup(state),
    lintTextGroup(state),
    inbox(state),
    history(state),
    stats(state),
    timeline(state),
    events(state),
    meta(state),
    config(state),
  )

export const apiLayer = (state: ServerState) =>
  HttpApiBuilder.layer(NetheriteApi, { openapiPath: '/api/openapi.json' }).pipe(
    Layer.provide(handlersLayer(state)),
  )
