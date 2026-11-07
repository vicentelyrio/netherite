import { SessionMeta } from '../constants'
import type { ServerState } from '../state'

const headEnd = /<\/head>/i

const escapeAttribute = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const meta = (name: string, content: string) =>
  `<meta name="${name}" content="${escapeAttribute(content)}">`

export const withSession = (
  html: string,
  state: Pick<ServerState, 'token' | 'version'> & {
    readonly repo: { readonly workspace: { readonly root: string } }
  },
) => {
  const tags = [
    meta(SessionMeta.Token, state.token),
    meta(SessionMeta.Version, state.version),
    meta(SessionMeta.Workspace, state.repo.workspace.root),
  ].join('')
  return headEnd.test(html) ? html.replace(headEnd, `${tags}</head>`) : `${tags}${html}`
}
