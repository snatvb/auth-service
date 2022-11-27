import { ApolloDriverConfig, ApolloDriver } from '@nestjs/apollo'
import { Module } from '@nestjs/common'
import { GraphQLModule } from '@nestjs/graphql'
import { join } from 'path'
import { PrismaModule } from '../prisma/prisma.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { validationSchema } from './config'
import { VerificationModule } from './verification/verification.module'
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter'
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      debug: process.env.NODE_ENV !== 'production',
      playground: true,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
    }),
    ConfigModule.forRoot({
      envFilePath: `${process.cwd()}/config/env/${process.env.NODE_ENV}.env`,
      isGlobal: true,
      validationSchema,
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      async useFactory(config: ConfigService): Promise<MailerOptions> {
        return {
          transport: {
            service: config.getOrThrow<string>('MAILER_SERVICE'),
            host: config.getOrThrow<string>('MAILER_HOST'),
            auth: {
              user: config.getOrThrow<string>('MAILER_USER'),
              pass: config.getOrThrow<string>('MAILER_PASSWORD'),
            },
          },
          defaults: {
            from: config.getOrThrow<string>('MAILER_FROM'),
          },
          template: {
            dir: __dirname + '/templates',
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
          },
        }
      },
    }),
    UsersModule,
    PrismaModule,
    AuthModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
