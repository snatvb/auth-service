import { JwtAuthContext } from './../auth/jwt-auth.guard'
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { UserEntity } from './entities/user.entity'
import { UpdateUserInput } from './dto/update-user.input'
import {
  BadRequestException,
  NotFoundException,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '~/auth/jwt-auth.guard'
import { OwnerGuard } from './owner.guard'
import { User } from '@prisma/client'

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => UserEntity, { name: 'me' })
  async me(@Context() context: JwtAuthContext): Promise<User> {
    const user = await this.users.findOneByUsername(context.req.user.username)
    if (!user) {
      throw new NotFoundException(
        `User with username ${context.req.user.username} not found`,
      )
    }

    return user
  }

  @Query(() => UserEntity, { name: 'user' })
  async findOne(@Args('id') id: string): Promise<User> {
    const user = await this.users.findOne(id)
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return user
  }

  @UseGuards(JwtAuthGuard, OwnerGuard<{ id: string }>(({ id }) => id))
  @Mutation(() => UserEntity)
  updateUser(@Args('id') id: string, @Args('input') input: UpdateUserInput) {
    return this.users.update(id, input)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard((_, { id }) => id))
  @Mutation(() => UserEntity)
  removeMe(@Context() context: JwtAuthContext) {
    return this.users.remove(context.req.user.id)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard<{ id: string }>(({ id }) => id))
  @Mutation(() => Boolean)
  changePassword(
    @Args('id') id: string,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ): Promise<boolean> {
    if (oldPassword === newPassword) {
      throw new BadRequestException('New password must be different')
    }
    return this.users
      .changePassword(id, oldPassword, newPassword)
      .then(() => true)
  }
}
