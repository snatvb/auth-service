import { InputType, Field, PartialType } from '@nestjs/graphql'
import { UpdateUserInput } from './update-user.input'

@InputType()
export class FullUpdateUserInput extends PartialType(UpdateUserInput) {
  @Field({ nullable: true })
  username: string

  @Field(() => [String], { nullable: true })
  roles: string[]

  @Field({ nullable: true })
  password: string

  @Field({ nullable: true })
  createdAt: Date

  @Field({ nullable: true })
  updatedAt: Date

  @Field({ nullable: true })
  emailVerified: boolean
}
