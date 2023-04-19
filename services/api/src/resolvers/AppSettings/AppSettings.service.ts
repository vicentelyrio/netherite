import { Service, Inject } from 'typedi'

import { BaseFileService, type File } from 'services/BaseFile.service'

import type { AppSettings } from './AppSettings.type'

@Service()
export class AppSettingsService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService

  async getAppSettings() {
    const file = await this.service.getFileByName('.config')

    if (!file) throw new Error('File not found')

    return mapFile(file)
  }
}

const mapFile = (file: File) => {
  const { data, raw } = file
  return { ...data, raw } as AppSettings
}
