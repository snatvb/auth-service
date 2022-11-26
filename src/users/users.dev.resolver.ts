import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { DevOnlyGuard } from './dev-only.guard'
import { UserEntity } from './entities/user.entity'
import { UsersService } from './users.service'

@Resolver(() => UserEntity)
export class UsersDevResolver {
  constructor(private readonly users: UsersService) {}

  @UseGuards(DevOnlyGuard)
  @Mutation(() => UserEntity)
  promoteRole__dev(@Args('id') id: string, @Args('role') role: string) {
    return this.users.promoteRole(id, role)
  }
}
