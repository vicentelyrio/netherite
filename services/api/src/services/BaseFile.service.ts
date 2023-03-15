import { Service } from 'typedi'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'

import type { File } from 'resolvers/file/file.type'

export interface BaseFileFactory {
  getFileByName(name: string): Promise<File | undefined>
  getAllFiles(): Promise<File[] | undefined>
  getFilesByTerms(terms: string[]): Promise<File[] | undefined>
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

  async getFilesByTerms(terms: string[]) {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        if (file.isFile() && path.extname(file.name) === this.fileExtension) {
          const data = await this.getFileByName(file.name)

          if (!data) continue

          const hasAllTermsPresent = terms.every((term) => data?.contents?.includes(term))

          if (hasAllTermsPresent) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }
}
