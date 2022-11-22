import { INestApplication } from '@nestjs/common'
import { TestingModule, Test } from '@nestjs/testing'
import gql from 'graphql-tag'
import { AppModule } from '~/app.module'
import request, { SuperTestExecutionResult } from 'supertest-graphql'
import { User } from '~/users/entities/user.entity'

export const testUser = {
  username: 'e2e_tester',
  password: 'e2e_tester_pass',
  email: 'e2e_tester@testere2e.com',
}

const createUserQL = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(createUserInput: $input) {
      id
      username
    }
  }
`
export async function recreateUser(app: INestApplication, user = testUser) {
  const result = await request<{
    createUser: { id: string; username: string }
  }>(app.getHttpServer())
    .mutate(createUserQL)
    .variables({
      input: user,
    })

  if (result.errors && result.errors[0].message === 'User already exists') {
    return
  }

  return result
}

export function loginUser(
  app: INestApplication,
  user: { username: string; password: string } = testUser,
) {
  return request<{
    signIn: { user: User; accessToken: string; refreshToken: string }
  }>(app.getHttpServer())
    .mutate(
      gql`
        mutation signIn($input: SignInInput!) {
          signIn(signInInput: $input) {
            user {
              id
              username
              email
              avatar
              createdAt
              updatedAt
            }
            accessToken
            refreshToken
          }
        }
      `,
    )
    .variables({
      input: {
        username: user.username,
        password: user.password,
      },
    })
    .expectNoErrors()
    .then(({ data }) => data!.signIn)
}

export async function createApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile()

  const app = moduleFixture.createNestApplication()
  await app.init()
  return app
}

export function removeUser(
  app: INestApplication,
  token: string,
  userId: number,
) {
  return request<{
    removeUser: { id: number; username: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation removeUser($input: Int!) {
          removeUser(id: $input) {
            id
            username
          }
        }
      `,
    )
    .variables({
      input: userId,
    })
}

export function removeMe(app: INestApplication, token: string) {
  return request<{
    removeMe: { id: number; username: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation removeMe {
          removeMe {
            id
            username
          }
        }
      `,
    )
    .variables({})
    .expectNoErrors()
    .then(({ data }) => data!.removeMe)
}

export function expectForbidden<T = unknown>(
  response: SuperTestExecutionResult<T>,
) {
  expect(response.errors?.[0]?.extensions.code).toBe('FORBIDDEN')
}
