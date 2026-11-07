import { Data } from 'effect'
import { loopbackHost } from '../constants'

export class NotLoopback extends Data.TaggedError('NotLoopback')<{ readonly host: string }> {
  override get message() {
    return `Refusing to listen on "${this.host}": the Netherite server only listens on loopback (${loopbackHost}) because it can write to your files.`
  }
}

export class PortInUse extends Data.TaggedError('PortInUse')<{
  readonly port: number
  readonly lastPort: number
}> {
  override get message() {
    return this.lastPort === this.port
      ? `Port ${this.port} is already in use. Pick another with --port, or stop what is using it.`
      : `Ports ${this.port} to ${this.lastPort} are all in use. Pick another with --port.`
  }
}
