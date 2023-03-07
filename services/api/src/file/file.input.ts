import type { File } from './file.type'
import { InputType, Field } from 'type-graphql'

@InputType()
export class FileInput implements Partial<File> {
  @Field()
  name?: string

  @Field()
  contents?: string
}
