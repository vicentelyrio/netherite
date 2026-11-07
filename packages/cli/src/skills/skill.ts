export interface Skill {
  readonly name: string
  readonly text: string
}

export const skill = (name: string, description: string, body: string): Skill => ({
  name,
  text: `---\nname: ${name}\ndescription: ${description}\n---\n\n${body.trim()}\n`,
})
