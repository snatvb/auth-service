import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Strategy, ExtractJwt } from 'passport-jwt'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.getOrThrow<string>('JWT_AT_SECRET'),
      ignoreExpiration: false,
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validate({ iat, exp, ...user }: any) {
    return user
  }
}
