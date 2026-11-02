import { type RenderResult, render } from '@testing-library/react'
import { inject } from 'vitest'
import { App } from '../src/app'
import { createApi } from '../src/lib/api'
import { createMemoryHistory } from '../src/router'

export const server = () => inject('server')

export const config = () => ({ baseUrl: server().url, token: server().token })

/** The app at a path, talking to the real server started for these tests. */
export const renderApp = (path = '/'): RenderResult =>
  render(<App config={config()} history={createMemoryHistory({ initialEntries: [path] })} />)

/** A client for changing things behind the app's back, as another person or an agent would. */
export const other = () => createApi(config())
