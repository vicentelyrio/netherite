import { Field, ObjectType } from 'type-graphql'

import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType({ description: 'Object representing a Label' })
export class Label {
  @Field({ description: 'The Label identifier' })
  identifier!: Identifier

  @Field({ description: 'The Label name' })
  name!: string

  @Field({ description: 'The Label slug' })
  slug?: string

  @Field({ description: 'The Label color' })
  color?: string
}

