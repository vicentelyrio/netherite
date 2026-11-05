import { type RenderResult, render } from '@testing-library/react'
import { inject } from 'vitest'
import { createApi } from '@/infrastructure/api'
import { App } from '../src/app'
import { createMemoryHistory } from '../src/router'

export const server = () => inject('server')

export const config = () => ({ baseUrl: server().url, token: server().token })

export const renderApp = (path = '/'): RenderResult =>
  render(
    <App env="test" config={config()} history={createMemoryHistory({ initialEntries: [path] })} />,
  )

export const other = () => createApi(config())
