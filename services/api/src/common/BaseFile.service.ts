import { Service } from 'typedi'
import { readdir, readFile } from 'node:fs/promises'

import type { File } from '@resolvers/file/file.type'
import path from 'node:path'
import os from 'node:os'

export interface BaseFileFactory {
  getFileByName(name: string): Promise<File | undefined>
  getAllFiles(): Promise<File[] | undefined>
  getFilesByTerm(term: string): Promise<File[] | undefined>
}

@Service()
export class BaseFileService implements BaseFileFactory {
  private readDir: typeof readdir = readdir
  private readFile: typeof readFile = readFile
  private root: string = path.resolve(os.homedir(), `Documents/@netherite/data/contents`)
  private fileExtension = '.md'

  async getFileByName(name: string) {
    try {
      const contents = await this.readFile(`${this.root}/${name}`, 'utf8')
      return { name, contents } as File
    }
    catch(err) {
      console.error(err)
      return
    }
  }

  async getAllFiles() {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        if (file.isFile() && path.extname(file.name) === this.fileExtension) {
          const data = await this.getFileByName(file.name)
          if (data) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }

  async getFilesByTerm(term: string) {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        if (file.isFile() && path.extname(file.name) === this.fileExtension) {
          const data = await this.getFileByName(file.name)
          if (data && data?.contents?.includes(term)) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }
}
