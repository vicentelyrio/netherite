export const SecurityMessage = {
  WrongHost: 'This server only answers requests addressed to its own loopback address.',
  WrongOrigin: 'Requests from other origins are not allowed.',
  CrossSite: 'Cross-site requests are not allowed.',
  NoToken: 'Writes need the session token.',
  BadToken: 'The session token is not valid.',
} as const
