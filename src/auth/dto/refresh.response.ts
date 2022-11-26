import { Field, ObjectType } from '@nestjs/graphql'
import { UserEntity } from '~/users/entities/user.entity'

@ObjectType()
export class RefreshResponse {
  @Field(() => UserEntity)
  user: UserEntity

  @Field()
  accessToken: string

  @Field()
  refreshToken: string
}
