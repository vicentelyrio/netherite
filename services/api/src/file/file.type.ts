import { Field, ObjectType } from 'type-graphql'

@ObjectType({ description: 'Object representing a file' })
export class File {
  @Field({ description: 'The File name', nullable: true })
  name?: string

  @Field({ description: 'The File contents', nullable: true })
  contents?: string
}
