import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'

import type { Page } from './Page.type'

@Service()
export class PageService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService
  private readonly prefix = 'PA__'
  private readonly matcher = /^PA__/

  async getPageByName(name: string) {
    const file = await this.service.getFileByName(`${this.prefix}${name}.md`)

    if (!file) throw new Error('File not found')

    return mapPage(file)
  }

  async getPages() {
    const goals = await this.service.getFilesByMatch(this.matcher)

    if (!goals.length) return []

    return goals.map(mapPage)
  }
}

const mapPage = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as Page
}
