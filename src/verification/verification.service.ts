import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import * as Joi from 'joi'

const tokenPayloadSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().required(),
})

export type TokenPayload = {
  userId: string
  email: string
}

@Injectable()
export class VerificationService {
  private secret: string
  private expiresIn: string
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.secret = this.config.getOrThrow<string>('JWT_EMAIL_SECRET')
    this.expiresIn = this.config.getOrThrow<string>('JWT_EMAIL_EXPIRES')
  }
  async sendVerificationEmail(userId: string, email: string): Promise<string> {
    // TODO: send email
    return this.issueToken(userId, email)
  }

  issueToken(userId: string, email: string) {
    const token = this.jwt.sign(
      { userId, email },
      { secret: this.secret, expiresIn: this.expiresIn },
    )

    return token
  }

  async verify(token: string): Promise<TokenPayload | void> {
    try {
      const payload = await this.jwt.verify(token, {
        secret: this.secret,
      })

      if (Joi.valid(payload, tokenPayloadSchema)) {
        return payload
      }
    } catch (error) {
      return undefined
    }

    return undefined
  }
}
