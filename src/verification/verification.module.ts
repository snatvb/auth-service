import { EmailModule } from './../email/email.module'
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { VerificationService } from './verification.service'

@Module({
  imports: [JwtModule, EmailModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
