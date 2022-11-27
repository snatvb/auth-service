import { VerificationModule } from './../verification/verification.module'
import { ConfigService } from '@nestjs/config'
import { UsersModule } from './../users/users.module'
import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthResolver } from './auth.resolver'
import { LocalStrategy } from './local.strategy'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { JwtStrategy } from './jwt.strategy'

@Module({
  imports: [
    PassportModule,
    UsersModule,
    VerificationModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES') },
        secret: config.get<string>('JWT_AT_SECRET'),
      }),
    }),
  ],
  providers: [AuthService, AuthResolver, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
