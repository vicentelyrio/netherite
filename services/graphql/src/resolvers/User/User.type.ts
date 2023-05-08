import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'Object representing a User' })
export class User {
  @Field({ description: 'The User name' })
  name!: string

  @Field({ description: 'The User slug' })
  slug?: string

  @Field({ description: 'The User initials' })
  initials?: string

  @Field({ description: 'The User email' })
  email?: string

  @Field({ description: 'The User avatar color' })
  color?: string
}
