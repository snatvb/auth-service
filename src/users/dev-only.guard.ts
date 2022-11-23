import { CanActivate, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class DevOnlyGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}
  canActivate() {
    const env = this.config.get('NODE_ENV')
    return env === 'development' || env === 'test'
  }
}
