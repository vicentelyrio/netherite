export const commitCount = (n: number, atLeast: boolean) =>
  `${n}${atLeast ? '+' : ''} ${n === 1 && !atLeast ? 'commit' : 'commits'}`
