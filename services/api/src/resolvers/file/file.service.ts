import { BaseFileService } from '../../common/BaseFile.service'
import { Service, Inject } from 'typedi'

@Service()
export class FileService {
  @Inject(() => BaseFileService)
  private readonly service!: BaseFileService

  async getFileByName(name: string) {
    return await this.service.getFileByName(name)
  }

  async getAllFiles() {
    return await this.service.getAllFiles()
  }

  async getFilesByTerm(term: string) {
    return await this.service.getFilesByTerm(term)
  }
}
