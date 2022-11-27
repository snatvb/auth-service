import { UseGuards } from '@nestjs/common'
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql'
import { User } from '@prisma/client'
import { JwtAuthGuard } from '~/auth/jwt-auth.guard'
import { CreateUserInput } from './dto/create-user.input'
import { FullUpdateUserInput } from './dto/full-update-user.input'
import { Role } from './entities/role.enum'
import { UserEntity } from './entities/user.entity'
import { Roles } from './roles.decorator'
import { RolesGuard } from './roles.guard'
import { UsersService } from './users.service'

@Resolver(() => UserEntity)
export class UsersAdminResolver {
  constructor(private readonly users: UsersService) {}

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Mutation(() => UserEntity)
  updateFullUser(
    @Args('id') id: string,
    @Args('input') input: FullUpdateUserInput,
  ) {
    return this.users.update(id, input)
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Query(() => [UserEntity], { name: 'users' })
  findAll(
    @Args('skip', { type: () => Int }) skip: number,
    @Args('take', { type: () => Int }) take: number,
  ): Promise<User[]> {
    return this.users.findAll(skip, take)
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Mutation(() => UserEntity)
  removeUser(@Args('id') id: string) {
    return this.users.remove(id)
  }

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.users.create(createUserInput)
  }
}
