import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'Object representing a Person' })
export class Person {
  @Field({ description: 'The Person name' })
  name!: string

  @Field({ description: 'The Person slug' })
  slug!: string

  @Field({ description: 'The Person initials' })
  initials!: string

  @Field({ description: 'The Person email' })
  email!: string

  @Field({ description: 'The Person avatar color' })
  color!: string
}
