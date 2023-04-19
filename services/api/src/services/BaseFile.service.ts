import { Service } from 'typedi'
import { readdir, readFile, writeFile } from 'node:fs/promises'
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
  createFile(raw: string, fileName: string): Promise<File>
  slugify(str: string): string
}

@Service()
export class BaseFileService implements BaseFileFactory {
  private readDir: typeof readdir = readdir
  private readFile: typeof readFile = readFile
  private writeFile: typeof writeFile = writeFile
  private root: string = path.resolve(os.homedir(), `Documents/@netherite/data/contents`)
  private fileExtension = '.md'

  /**
  * @memberof File Service
  * @alias getAllFiles
  */
  async getAllFiles() {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        if (file.isFile() && path.extname(file.name) === this.fileExtension) {
          const data = await this.getFileByName(path.parse(file.name).name)
          if (data) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }

  /**
  * @memberof File Service
  * @alias getFileByName
  * @property {string} name
  */
  async getFileByName(name: string) {
    try {
      const raw = await this.readFile(`${this.root}/${name}${this.fileExtension}`, 'utf8')
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

  /**
  * @memberof File Service
  * @alias getFilesByMatch
  * @property {RegExp} matcher
  */
  async getFilesByMatch(matcher: RegExp) {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        const fileIsValid = file.isFile() && path.extname(file.name) === this.fileExtension

        if (fileIsValid && file.name.match(matcher)) {
          const data = await this.getFileByName(path.parse(file.name).name)
          if (data) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }

  /**
  * @memberof File Service
  * @alias getFilesByMatchContent
  * @property {RegExp} matcher
  * @property {string} content
  */
  async getFilesByMatchContent(matcher: RegExp, content: string) {
    console.log(content)
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        const fileIsValid = file.isFile() && path.extname(file.name) === this.fileExtension

        if (fileIsValid && file.name.match(matcher)) {
          const data = await this.getFileByName(path.parse(file.name).name)
          if (data && data.raw.includes(content)) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }

  /**
  * @memberof File Service
  * @alias getFilesByContent
  * @property {string} matcher
  */
  async getFilesByContent(content: string) {
    try {
      const fileNames = await this.readDir(this.root, { withFileTypes: true })
      const loadedFiles: File[] = []

      for (const file of fileNames) {
        const fileIsValid = file.isFile() && path.extname(file.name) === this.fileExtension

        if (fileIsValid) {
          const data = await this.getFileByName(path.parse(file.name).name)
          if (data && data.raw.includes(content)) loadedFiles.push(data)
        }
      }

      return loadedFiles
    } catch (err) {
      console.error(err)
      return []
    }
  }

  /**
  * @memberof File Service
  * @alias createFile
  * @property {raw} markdown string
  */
  async createFile<T>(raw: string, fileName: string): Promise<T> {
    try {
      const savedFile = await this.writeFile(`${this.root}/${fileName}${this.fileExtension}`, raw, 'utf8')
      return savedFile as T
    } catch (err) {
      throw new Error('Error creating file')
    }
  }

  /**
  * @memberof File Service
  * @alias slugify
  * @property {string} str
  */
  slugify (str: string) {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }
}
