import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class UserEntity {
  @Field()
  id: string

  @Field()
  username: string

  @Field()
  email: string

  @Field()
  emailVerified: boolean

  @Field({ nullable: true })
  avatar?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date

  @Field(() => [String])
  roles: string[]
}
