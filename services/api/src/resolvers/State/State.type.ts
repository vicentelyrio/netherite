import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'Object representing a State' })
export class State {
  @Field({ description: 'The State name' })
  name!: string
}

