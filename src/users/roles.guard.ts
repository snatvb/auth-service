import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { GqlExecutionContext } from '@nestjs/graphql'
import { JwtAuthContext } from '~/auth/jwt-auth.guard'
import { Role } from './entities/role.enum'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const requireRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requireRoles) {
      return true
    }

    const ctx = GqlExecutionContext.create(context)
    const request: JwtAuthContext['req'] = ctx.getContext().req
    if (!request.user) {
      return false
    }

    return requireRoles.some((role) => request.user.roles.includes(role))
  }
}
