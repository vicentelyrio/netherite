import { Service } from 'typedi'

import {
  Resolver,
  Query,
  Arg,
} from 'type-graphql'

import { File } from './file.type'
import { FileService } from './file.service'

@Service()
@Resolver(() => File)
export class FileResolver {
  constructor(private readonly service: FileService) {}

  @Query(() => File, { nullable: true, description: 'Get a File By name' })
  async getFileByName(@Arg('name') name: string): Promise<File | undefined> {
    return await this.service.getFileByName(name)
  }

  @Query(() => [File], { description: 'Get all the files' })
  async getAllFiles(): Promise<File[]> {
    return await this.service.getAllFiles()
  }

  @Query(() => [File], { description: 'Get all the files containing a specific term' })
  async getFilesByTerm(@Arg('term') term: string): Promise<File[]> {
    return await this.service.getFilesByTerm(term)
  }
}
