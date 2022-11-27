import { JwtAuthContext, JwtAuthGuard } from './jwt-auth.guard'
import { GqlAuthContext, GqlAuthGuard } from './gql-auth.guard'
import { UseGuards } from '@nestjs/common'
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthService } from './auth.service'
import { SignInInput } from './dto/sign-in.input'
import { SignInResponse } from './dto/sign-in.response'
import { RefreshResponse } from './dto/refresh.response'
import { Token } from './enitities/token.entity'
import { UserEntity } from '~/users/entities/user.entity'
import { User } from '@prisma/client'
import { SignUpInput } from './dto/sign-up.input'

@Resolver()
export class AuthResolver {
  constructor(private readonly service: AuthService) {}

  @Mutation(() => SignInResponse)
  @UseGuards(GqlAuthGuard)
  signIn(
    @Args('signInInput') input: SignInInput,
    @Context() context: GqlAuthContext,
  ) {
    return this.service.signIn(context.user.username)
  }

  @Mutation(() => UserEntity)
  signUp(@Args('signUpInput') input: SignUpInput) {
    return this.service.signUp(input)
  }

  @Query(() => Boolean)
  resendVerification(@Args('userId') userId: string) {
    return this.service.resendVerification(userId)
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  signOut(@Args('refreshToken') refreshToken: string) {
    return this.service.signOut(refreshToken)
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  signOutAll(@Context() context: JwtAuthContext) {
    return this.service.signOutAll(context.req.user.username)
  }

  @Mutation(() => RefreshResponse)
  refresh(@Args('refreshToken') refreshToken: string) {
    return this.service.refresh(refreshToken)
  }

  @Query(() => [Token])
  @UseGuards(JwtAuthGuard)
  sessions(@Context() context: JwtAuthContext) {
    return this.service.findSessions(context.req.user.id)
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean)
  terminateSession(@Args('id') id: string, @Context() context: JwtAuthContext) {
    return this.service.terminateSession(context.req.user.id, id)
  }

  @Mutation(() => UserEntity)
  recoveryPassword(
    @Args('token') token: string,
    @Args('password') password: string,
  ): Promise<User> {
    return this.service.recoveryPassword(token, password)
  }

  @Query(() => Boolean)
  async requestRecoveryPassword(
    @Args('email') email: string,
  ): Promise<boolean> {
    return this.service.sendRecoveryPasswordToken(email)
  }

  @Mutation(() => UserEntity)
  verifyEmail(@Args('token') token: string): Promise<User> {
    return this.service.verifyEmail(token)
  }
}
