import { InputType, Field, PartialType } from '@nestjs/graphql'
import { UpdateUserInput } from './update-user.input'

@InputType()
export class FullUpdateUserInput extends PartialType(UpdateUserInput) {
  @Field({ nullable: true })
  username: string

  @Field({ nullable: true })
  password: string
}
