import { Field, ObjectType } from 'type-graphql'

import { Person } from '@resolvers/Person/Person.type'

@ObjectType({ description: 'Object representing a Label' })
export class Label {
  @Field({ description: 'The Label name' })
  name!: string

  @Field({ description: 'The Label slug' })
  slug!: string

  @Field({ description: 'The Label color' })
  color!: string

  @Field({ description: 'The Label creation date' })
  createdAt!: Date

  @Field({ description: 'The Label last edition date' })
  editedAt!: Date

  @Field(() => Person, { description: 'The Label author' })
  createdBy!: Person

  @Field(() => Person, { description: 'The Label last editor' })
  editedBy!: Person
}

