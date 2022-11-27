import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import * as Joi from 'joi'

const tokenEmailSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().required(),
})

const tokenPasswordSchema = Joi.object({
  email: Joi.string().required(),
})

export type TokenEmailPayload = {
  userId: string
  email: string
}

export type TokenRecoveryPayload = {
  userId: string
}

@Injectable()
export class VerificationService {
  private email: {
    secret: string
    expiresIn: string
  }
  private password: {
    secret: string
    expiresIn: string
  }

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {
    this.email = {
      secret: this.config.getOrThrow('JWT_EMAIL_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_EMAIL_EXPIRES'),
    }
    this.password = {
      secret: this.config.getOrThrow('JWT_RECOVERY_SECRET'),
      expiresIn: this.config.getOrThrow('JWT_RECOVERY_EXPIRES'),
    }
  }
  async sendVerificationEmail(userId: string, email: string): Promise<boolean> {
    // TODO: send email
    this.issueEmailToken(userId, email)
    return true
  }

  issueEmailToken(userId: string, email: string) {
    const token = this.jwt.sign(
      { userId, email },
      { secret: this.email.secret, expiresIn: this.email.expiresIn },
    )

    return token
  }

  issuePasswordToken(userId: string) {
    const token = this.jwt.sign(
      { userId },
      { secret: this.password.secret, expiresIn: this.password.expiresIn },
    )

    return token
  }

  async verifyPassword(token: string): Promise<TokenEmailPayload | void> {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.password.secret,
      })
      if (tokenPasswordSchema.valid(payload)) {
        return payload
      }
      return undefined
    } catch (error) {
      return undefined
    }
  }

  async verifyEmail(token: string): Promise<TokenEmailPayload | void> {
    try {
      const payload = await this.jwt.verify(token, {
        secret: this.email.secret,
      })

      if (Joi.valid(payload, tokenEmailSchema)) {
        return payload
      }
      return undefined
    } catch (error) {
      return undefined
    }
  }
}
