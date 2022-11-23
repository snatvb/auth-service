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
import { DevOnlyGuard } from './dev-only.guard'
import { RolesGuard } from './roles.guard'

@Resolver(() => UserEntity)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, OwnerGuard<{ id: string }>(({ id }) => id))
  @Mutation(() => UserEntity)
  updateUser(@Args('id') id: string, @Args('input') input: UpdateUserInput) {
    return this.usersService.update(id, input)
  }

  @Mutation(() => UserEntity)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput)
  }

  @Roles(Role.Admin)
  @Mutation(() => UserEntity)
  removeUser(@Args('id') id: string) {
    return this.usersService.remove(id)
  }

  // @Roles(Role.Admin)
  // @UseGuards(JwtAuthGuard)
  // @Mutation(() => UserEntity)
  // promoteRole(@Args('id') id: string, @Args('role') role: string) {
  //   return this.usersService.promoteRole(id, role)
  // }

  @UseGuards(JwtAuthGuard, OwnerGuard((_, { id }) => id))
  @Mutation(() => UserEntity)
  removeMe(@Context() context: JwtAuthContext) {
    return this.usersService.remove(context.req.user.id)
  }

  @UseGuards(DevOnlyGuard)
  @Mutation(() => UserEntity)
  promoteRole__dev(@Args('id') id: string, @Args('role') role: string) {
    return this.usersService.promoteRole(id, role)
  }
}
