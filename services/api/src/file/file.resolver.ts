import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'

import {
  Resolver,
  Query,
  Arg,
  Ctx,
  /* FieldResolver, */
  /* Root, */
  /* Mutation, */
  /* Int, */
} from 'type-graphql'

import { File } from './file.type'
/* import { FileInput } from './file.input' */

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)
/* const writeFile = promisify(fs.writeFile) */

type ApiConfig = {
  appRoot: string
}

@Resolver(() => File)
export class FileResolver {
  @Query(() => File, { nullable: true, description: 'Get a File By name' })
  async getFileByName(@Arg('name') name: string, @Ctx() ctx: ApiConfig): Promise<File | undefined> {
    const filename = `${name}.md`
    const fileExists = await exists(`${ctx.appRoot}/${filename}`)

    if (fileExists) {
      return getFileContents(filename, ctx.appRoot)
    } else {
      throw new Error(`File does not exist`)
    }
  }

  @Query(() => [File], { description: 'Get all the files' })
  async getFiles(@Ctx() ctx: ApiConfig): Promise<File[]> {
    const files = await readdir(ctx.appRoot)
    const entries = files.filter(filename => filename.includes('.md')).map(getFileContentsArray(ctx.appRoot))

    return entries as any
  }
}

const getFileContentsArray = (appRoot: string) => (fileName: string) => getFileContents(fileName, appRoot)

const getFileContents = async (filename: string, appRoot: string) => {
  const rawFile = await readFile(`${appRoot}/${filename}`)
  /* const parsedFile = matter(rawFile) */
  return {
    /* title: parsedFile.data.title, */
    /* author: parsedFile.data.author, */
    /* body: parsedFile.content, */
    rawFile,
    name: path.basename(filename, '.md'),
  };
}
