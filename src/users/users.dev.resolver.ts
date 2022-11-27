import { NotFoundException } from '@nestjs/common'
import { Args, Int, Mutation, Resolver } from '@nestjs/graphql'
import { VerificationService } from '~/verification/verification.service'
import { UserEntity } from './entities/user.entity'
import { UsersService } from './users.service'

@Resolver(() => UserEntity)
export class UsersDevResolver {
  constructor(
    private readonly users: UsersService,
    private readonly verification: VerificationService,
  ) {}

  @Mutation(() => UserEntity)
  promoteRole__dev(@Args('id') id: string, @Args('role') role: string) {
    return this.users.promoteRole(id, role)
  }

  @Mutation(() => UserEntity)
  removeUser__dev(@Args('id') id: string) {
    return this.users.remove(id)
  }

  @Mutation(() => Int)
  removeUsersByUsernames__dev(
    @Args('usernames', { type: () => [String] }) usernames: string[],
  ): Promise<number> {
    return this.users.removeByUsernames(usernames)
  }

  @Mutation(() => String)
  async issueEmailVerifyToken__dev(@Args('id') id: string): Promise<string> {
    const user = await this.users.findOne(id)
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return this.verification.issueEmailToken(user.id, user.email)
  }

  @Mutation(() => String)
  async issuePasswordVerifyToken__dev(@Args('id') id: string): Promise<string> {
    const user = await this.users.findOne(id)
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`)
    }
    return this.verification.issuePasswordToken(user.id)
  }
}
