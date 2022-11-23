import { JwtAuthContext } from './../auth/jwt-auth.guard'
import { Resolver, Query, Mutation, Args, Int, Context } from '@nestjs/graphql'
import { UsersService } from './users.service'
import { User as UserEntity } from './entities/user.entity'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import { NotFoundException, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '~/auth/jwt-auth.guard'
import { OwnerGuard } from './owner.guard'
import { User } from '@prisma/client'
import { Role } from './entities/role.enum'
import { Roles } from './roles.decorator'

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @Query(() => [UserEntity], { name: 'users' })
  findAll(
    @Args('skip', { type: () => Int }) skip: number,
    @Args('take', { type: () => Int }) take: number,
  ) {
    return this.usersService.findAll(skip, take)
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserEntity, { name: 'me' })
  async me(@Context() context: JwtAuthContext): Promise<User> {
    const user = await this.usersService.findOneByUsername(
      context.req.user.username,
    )
    if (!user) {
      throw new NotFoundException(
        `User with username ${context.req.user.username} not found`,
      )
    }

    return user
  }

  @Query(() => UserEntity, { name: 'user' })
  async findOne(@Args('id') id: string): Promise<User> {
    const user = await this.usersService.findOne(id)
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return user
  }

  @UseGuards(
    JwtAuthGuard,
    OwnerGuard<{ updateUserInput: UpdateUserInput }>(
      ({ updateUserInput }) => updateUserInput.id,
    ),
  )
  @Mutation(() => UserEntity)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput)
  }

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput)
  }

  @Mutation(() => UserEntity)
  @Roles(Role.Admin)
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id)
  }

  @UseGuards(JwtAuthGuard, OwnerGuard((_, { id }) => id))
  @Mutation(() => UserEntity)
  removeMe(@Context() context: JwtAuthContext) {
    return this.usersService.remove(context.req.user.id)
  }
}
