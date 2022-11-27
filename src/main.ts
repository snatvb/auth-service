import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { PrismaService } from '../prisma/prisma.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const prismaService = app.get(PrismaService)
  await prismaService.enableShutdownHooks(app)
  await app.listen(app.get(ConfigService).getOrThrow<number>('PORT'))
}

bootstrap()
