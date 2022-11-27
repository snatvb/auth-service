import { INestApplication } from '@nestjs/common'
import { TestingModule, Test } from '@nestjs/testing'
import gql from 'graphql-tag'
import { AppModule } from '~/app.module'
import request, { SuperTestExecutionResult } from 'supertest-graphql'
import { UserEntity } from '~/users/entities/user.entity'
import {
  removeUsersByUsernamesDevQL,
  ResponseRemoveUsersByUsernames,
  ResponseSignUp,
  ResponseUpdateUser,
  signUpQL,
  updateUserQL,
} from './gql'
import { EmailService } from '~/email/email.service'
import { EmailMockService } from './EmailMockService'

export async function signUp(
  app: INestApplication,
  user: { username: string; password: string; email: string },
) {
  const result = await request<ResponseSignUp>(app.getHttpServer())
    .mutate(signUpQL)
    .variables({
      input: user,
    })
    .expectNoErrors()

  return result
}

export function loginUser(
  app: INestApplication,
  user: { username: string; password: string },
) {
  return request<{
    signIn: { user: UserEntity; accessToken: string; refreshToken: string }
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
              roles
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
  })
    .overrideProvider(EmailService)
    .useClass(EmailMockService)
    .compile()

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

export function expectBadRequest<T = unknown>(
  response: SuperTestExecutionResult<T>,
) {
  expect(response.errors?.[0]?.extensions.code).toBe('BAD_USER_INPUT')
}

export function expectUnauthorized<T = unknown>(
  response: SuperTestExecutionResult<T>,
) {
  expect(response.errors?.[0]?.extensions.code).toBe('UNAUTHENTICATED')
}

export function expectNotFound<T = unknown>(
  response: SuperTestExecutionResult<T>,
) {
  expect(response.errors?.[0]?.extensions.code).toBe('404')
}

export function updateUser(
  app: INestApplication,
  token: string,
  userId: string,
) {
  return request<ResponseUpdateUser>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(updateUserQL)
    .variables({
      id: userId,
      input: {
        avatar: 'https://example.com/avatar.png',
      },
    })
}

export function removeUsersByUsernames(
  app: INestApplication,
  usernames: Array<UserEntity['username']>,
) {
  return request<ResponseRemoveUsersByUsernames>(app.getHttpServer())
    .mutate(removeUsersByUsernamesDevQL)
    .variables({
      usernames,
    })
    .expectNoErrors()
}
