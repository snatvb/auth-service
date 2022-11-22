import { ExecutionContext, Injectable } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { AuthGuard } from '@nestjs/passport'
import { SignInInput } from './dto/sign-in.input'

@Injectable()
export class GqlAuthGuard extends AuthGuard('local') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context)
    const request = ctx.getContext()
    request.body = ctx.getArgs().signInInput
    return request
  }
}

export type GqlAuthContext = {
  user: SignInInput
}
