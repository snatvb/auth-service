import { EmailService } from './email/email.service'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from '../prisma/prisma.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)
  // const emailService = app.get(EmailService)
  // emailService.sendEmail({
  //   to: 'aa@royal.design',
  //   subject: 'Hello',
  //   templateName: 'reset-password',
  //   data: {
  //     token: 'testToken',
  //     username: 'testUsername',
  //     link: 'https://google.com',
  //     appName: 'Royal Design',
  //   },
  // })
  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'))
}

bootstrap()
