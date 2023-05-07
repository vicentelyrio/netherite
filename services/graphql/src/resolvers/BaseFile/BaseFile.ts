import { Field, ObjectType } from 'type-graphql'
import { IsString } from 'class-validator'

import type { Identifier } from 'resolvers/Identifier/Identifier'

@ObjectType()
export class BaseFile {
  @IsString()
  @Field({ description: 'The File identifier' })
  identifier!: Identifier

  @IsString()
  @Field({ description: 'The File raw markdown' })
  raw!: string
}
