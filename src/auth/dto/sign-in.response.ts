import { Field, ObjectType } from '@nestjs/graphql'
import { User } from '~/users/entities/user.entity'

@ObjectType()
export class SignInResponse {
  @Field(() => User)
  user: User

  @Field()
  accessToken: string

  @Field()
  refreshToken: string
}
