import { ObjectType, Field, Int } from '@nestjs/graphql'

@ObjectType()
export class Token {
  @Field(() => Int)
  id: string

  @Field()
  userId: string

  @Field()
  email: string

  @Field({ nullable: true })
  avatar?: string

  @Field()
  createdAt: Date

  @Field()
  updatedAt: Date
}
