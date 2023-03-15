import { Field, ObjectType } from 'type-graphql'

import { Person } from 'resolvers/Person/Person.type'

@ObjectType({ description: 'Object representing a GoalType' })
export class GoalType {
  @Field({ description: 'The GoalType name' })
  name!: string

  @Field({ description: 'The GoalType description' })
  description!: string

  @Field({ description: 'The GoalType slug' })
  slug!: string

  @Field({ description: 'The GoalType creation date' })
  createdAt!: Date

  @Field({ description: 'The GoalType last edition date' })
  editedAt!: Date

  @Field(() => Person, { description: 'The GoalType author' })
  createdBy!: Person

  @Field(() => Person, { description: 'The GoalType last editor' })
  editedBy!: Person
}

