import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'

import type { UI } from './UI.type'

@Service()
export class UIService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService
  private readonly prefix = 'UI__'
  private readonly matcher = /^UI__/

  async getUIByName(name: string) {
    const file = await this.service.getFileByName(`${this.prefix}${name}.md`)

    if (!file) throw new Error('File not found')

    return mapUI(file)
  }

  async getUIs() {
    const goals = await this.service.getFilesByMatch(this.matcher)

    if (!goals.length) return []

    return goals.map(mapUI)
  }
}

const mapUI = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as UI
}
