export const frontmatterEnd = (text: string) => {
  const close = text.indexOf('\n---\n', 4)
  return close === -1 ? text.length : close + 5
}

export const templateBody = (text: string, title: string): string => {
  const rest = text.slice(frontmatterEnd(text)).replaceAll('{{title}}', title)
  const heading = rest.match(/^\s*# .*\n/)
  return (heading === null ? rest : rest.slice(heading[0].length)).trim()
}
