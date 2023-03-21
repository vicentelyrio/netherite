import { Field, ObjectType, registerEnumType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

enum UISection {
  page = 'PAGE',
  navigation = 'NAVIGATION',
  workspace = 'WORKSPACE',
  panel = 'PANEL',
  modal = 'MODAL',
}

registerEnumType(UISection, {
  name: 'UISection',
  description: 'The UI possible sections',
})

@ObjectType({ description: 'Object representing a UI' })
export class UI {
  @Field({ description: 'The UI identifier' })
  identifier!: Identifier

  @Field({ description: 'The UI section' })
  section!: UISection

  @Field({ description: 'The UI layout' })
  layout!: string

  @Field({ description: 'The UI raw markdown' })
  raw!: string
}

