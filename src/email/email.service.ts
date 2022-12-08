import { MailerService } from '@nestjs-modules/mailer'
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

export type TemplateName = 'verify-email' | 'reset-password' | 'change-email'

export type SendArgs = {
  templateName: TemplateName
  data?: Record<string, any>
  to: string | string[]
  subject: string
}

@Injectable()
export class EmailService {
  private from: string
  constructor(
    private readonly mailer: MailerService,
    private readonly config: ConfigService,
  ) {
    this.from = config.getOrThrow<string>('MAILER_FROM')
  }

  sendEmail({ to, data, templateName, subject }: SendArgs) {
    return this.mailer.sendMail({
      to,
      subject,
      from: this.from, // sender address
      template: templateName,
      context: data,
    })
  }
}
