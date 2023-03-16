import { Field, ObjectType } from 'type-graphql'

import { User } from 'resolvers/User/User.type'

@ObjectType({ description: 'Object representing a GoalType' })
export class GoalType {
  @Field({ description: 'The GoalType name' })
  name!: string

  @Field({ description: 'The GoalType description' })
  description!: string

  @Field({ description: 'The GoalType slug' })
  slug!: string

  @Field({ description: 'The GoalType creation date' })
  createdAt?: Date

  @Field({ description: 'The GoalType last edition date' })
  editedAt?: Date

  @Field(() => User, { description: 'The GoalType author' })
  createdBy?: User

  @Field(() => User, { description: 'The GoalType last editor' })
  editedBy?: User
}

