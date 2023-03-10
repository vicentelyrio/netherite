import * as fs from 'fs'
import * as path from 'path'
import { promisify } from 'util'
import { find } from 'find-in-files'

import {
  Resolver,
  Query,
  Arg,
  Ctx,
} from 'type-graphql'

import { File } from './file.type'

const readdir = promisify(fs.readdir)
const readFile = promisify(fs.readFile)
const exists = promisify(fs.exists)

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
    return entries as File[]
  }

  @Query(() => [File], { description: 'Get all the files containing a specific term' })
  async getFilesByTerm(@Arg('term') term: string, @Ctx() ctx: ApiConfig): Promise<File[]> {
    const files = await find(term, ctx.appRoot)

    if (!files) return []

    const fileList: File[] = []

    Object.entries(files).map(([name]) => {
      const file = getFileContents(name) as File

      if (file) fileList.push(file)
    })

    return fileList as File[]
  }
}

const getFileContentsArray = (appRoot: string) => (fileName: string) => getFileContents(fileName, appRoot)

const getFileContents = async (filename: string, appRoot?: string) => {
  const rawFile = await readFile(appRoot ? `${appRoot}/${filename}` : filename, 'utf8')
  return {
    contents: rawFile as string,
    name: path.basename(filename, '.md'),
  };
}
