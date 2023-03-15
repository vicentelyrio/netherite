import { Field, InputType } from 'type-graphql'

import { GoalType } from '@resolvers/GoalType/GoalType.type'
import type { Goal } from './Goal.type'

@InputType()
export class GoalInput implements Partial<Goal> {
  @Field({ description: 'The Goal name' })
  name!: string

  @Field({ description: 'The Goal description' })
  description!: string

  @Field({ description: 'The Goal duration' })
  duration!: Date

  @Field(() => GoalType, { description: 'The Goal type' })
  type!: GoalType
}
