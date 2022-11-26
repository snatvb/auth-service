import { VerificationModule } from './../verification/verification.module'
import { UsersDevResolver } from './users.dev.resolver'
import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersResolver } from './users.resolver'
import { UsersAdminResolver } from './users.admin.resolver'

@Module({
  imports: [VerificationModule],
  providers: [
    UsersResolver,
    UsersAdminResolver,
    UsersService,
    ...(process.env.NODE_ENV === 'production' ? [] : [UsersDevResolver]),
  ],
  exports: [UsersService],
})
export class UsersModule {}
