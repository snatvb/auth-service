import { ObjectType, Field } from '@nestjs/graphql'

@ObjectType()
export class Token {
  @Field()
  id: string

  @Field()
  token: string

  @Field()
  userId: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
