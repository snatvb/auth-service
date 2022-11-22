import { CanActivate, ExecutionContext } from '@nestjs/common'
import { GqlExecutionContext } from '@nestjs/graphql'
import { JwtAuthContext } from '~/auth/jwt-auth.guard'

export function OwnerGuard<T = unknown>(
  getId: (args: T, user: JwtAuthContext['req']['user']) => string,
) {
  return class OwnerGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
      const ctx = GqlExecutionContext.create(context)
      const request: JwtAuthContext['req'] = ctx.getContext().req
      if (!request.user) {
        return false
      }
      return request.user.id === getId(ctx.getArgs(), request.user)
    }
  }
}
