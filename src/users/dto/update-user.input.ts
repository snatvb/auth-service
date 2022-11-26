import { InputType, Field } from '@nestjs/graphql'

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  avatar: string

  @Field({ nullable: true })
  username: string
}
