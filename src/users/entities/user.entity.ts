import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class User {
  @Field()
  id: string

  @Field()
  username: string

  @Field()
  email: string

  @Field({ nullable: true })
  avatar?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
