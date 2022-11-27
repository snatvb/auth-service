import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { Injectable } from '@nestjs/common'
import * as Joi from 'joi'
import { EmailService } from '~/email/email.service'
import { t } from '~/helpers'

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

export type sendRecoveryPasswordArgs = {
  email: string
  userId: string
  username: string
}

@Injectable()
export class VerificationService {
  private cfg: {
    password: {
      secret: string
      expiresIn: string
    }
    email: {
      secret: string
      expiresIn: string
    }
    passwordRecoveryLinkTemplate: string
    appName: string
  }

  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {
    this.cfg = {
      email: {
        secret: this.config.getOrThrow<string>('JWT_EMAIL_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_EMAIL_EXPIRES'),
      },
      password: {
        secret: this.config.getOrThrow<string>('JWT_RECOVERY_SECRET'),
        expiresIn: this.config.getOrThrow<string>('JWT_RECOVERY_EXPIRES'),
      },
      passwordRecoveryLinkTemplate: this.config.getOrThrow<string>(
        'MAILER_RECOVERY_LINK_TEMPLATE',
      ),
      appName: this.config.getOrThrow<string>('MAILER_APP_NAME'),
    }
  }
  async sendVerificationEmail(userId: string, email: string): Promise<boolean> {
    // TODO: send email
    this.issueEmailToken(userId, email)
    return true
  }

  issueEmailToken(userId: string, email: string) {
    const { secret, expiresIn } = this.cfg.email
    const token = this.jwt.sign({ userId, email }, { secret, expiresIn })

    return token
  }

  issuePasswordToken(userId: string) {
    const { secret, expiresIn } = this.cfg.password
    const token = this.jwt.sign({ userId }, { secret, expiresIn })

    return token
  }

  async verifyPassword(token: string): Promise<TokenEmailPayload | void> {
    try {
      const payload = await this.jwt.verifyAsync(token, {
        secret: this.cfg.password.secret,
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
        secret: this.cfg.email.secret,
      })

      if (Joi.valid(payload, tokenEmailSchema)) {
        return payload
      }
      return undefined
    } catch (error) {
      return undefined
    }
  }

  async sendRecoveryPassword({
    userId,
    username,
    email,
  }: sendRecoveryPasswordArgs): Promise<boolean> {
    const token = await this.issuePasswordToken(userId)
    return await this.email
      .sendEmail({
        to: email,
        subject: 'Password recovery',
        templateName: 'reset-password',
        data: {
          token,
          username,
          link: t.renderText(this.cfg.passwordRecoveryLinkTemplate, {
            token,
          }),
          appName: this.cfg.appName,
        },
      })
      .then(() => true)
      .catch(() => false)
  }
}
