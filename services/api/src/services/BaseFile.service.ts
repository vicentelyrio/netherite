import { Service } from 'typedi'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import matter, { type GrayMatterFile } from 'gray-matter'

export interface File extends GrayMatterFile<string> {
  raw: string
}

export interface BaseFileFactory {
  getFileByName(name: string): Promise<File | undefined>
  getAllFiles(): Promise<File[] | undefined>
  getFilesByMatch(matcher: RegExp): Promise<File[] | undefined>
}

@Service()
export class BaseFileService implements BaseFileFactory {
  private readDir: typeof readdir = readdir
  private readFile: typeof readFile = readFile
  private root: string = path.resolve(os.homedir(), `Documents/@netherite/data/contents`)
  private fileExtension = '.md'

  /*
  * - Get File by name
  * - Parse front-matter data
  * */
  async getFileByName(name: string) {
    try {
      const raw = await this.readFile(`${this.root}/${name}`, 'utf8')
      return {
        ...matter(raw),
        raw
      }
    }
    catch(err) {
      console.error(err)
      return
    }
  }

  /*
  * - Get All files
  * - Parse front-matter data
  * */
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

  /*
  * - Get files by name part
  * - Parse front-matter data
  * */
  async getFilesByMatch(matcher: RegExp) {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        const fileIsValid = file.isFile() && path.extname(file.name) === this.fileExtension

        if (fileIsValid && file.name.match(matcher)) {
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

  /* async getFilesByTerms(terms: string[]) { */
  /*   try { */
  /*     const fileNames = await this.readDir(this.root, { withFileTypes: true }) */
  /*     const loadedFiles: GrayMatterFile<string>[] = [] */
  /**/
  /*     for (const file of fileNames) { */
  /*       if (file.isFile() && path.extname(file.name) === this.fileExtension) { */
  /*         const data = await this.getFileByName(file.name) */
  /**/
  /*         if (!data) continue */
  /**/
  /*         const hasAllTermsPresent = terms.every((term) => data?.includes(term)) */
  /**/
  /*         if (hasAllTermsPresent) loadedFiles.push(data) */
  /*       } */
  /*     } */
  /**/
  /*     return loadedFiles */
  /*   } catch (err) { */
  /*     console.error(err) */
  /*     return [] */
  /*   } */
  /* } */
}
