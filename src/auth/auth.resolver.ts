import { JwtAuthContext, JwtAuthGuard } from './jwt-auth.guard'
import { GqlAuthContext, GqlAuthGuard } from './gql-auth.guard'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { SignInInput } from './dto/sign-in.input'
import { SignInResponse } from './dto/sign-in.response'
import { RefreshResponse } from './dto/refresh.response'
import { Token } from './enitities/token.entity'

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => SignInResponse)
  @UseGuards(GqlAuthGuard)
  signIn(
    @Args('signInInput') input: SignInInput,
    @Context() context: GqlAuthContext,
  ) {
    return this.authService.signIn(context.user.username)
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  signOut(@Args('refreshToken') refreshToken: string) {
    return this.authService.signOut(refreshToken)
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  signOutAll(@Context() context: JwtAuthContext) {
    return this.authService.signOutAll(context.req.user.username)
  }

  @Mutation(() => RefreshResponse)
  refresh(@Args('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken)
  }

  @Query(() => [Token])
  @UseGuards(JwtAuthGuard)
  sessions(@Context() context: JwtAuthContext) {
    return this.authService.findSessions(context.req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  terminateSession(@Args('id') id: string, @Context() context: JwtAuthContext) {
    return this.authService.terminateSession(context.req.user.id, id)
  }
}
