import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'
import {
  createApp,
  recreateUser,
  expectForbidden,
  loginUser,
  removeMe,
  expectNotFound,
  expectUnauthorized,
} from './helpers'
import { hashToken } from '~/auth/auth.service'

const refreshQL = gql`
  mutation refresh($refreshToken: String!) {
    refresh(refreshToken: $refreshToken) {
      accessToken
      refreshToken
    }
  }
`

const sessionsQL = gql`
  {
    sessions {
      id
      token
      userId
    }
  }
`

const signOutQL = gql`
  mutation signOut($refreshToken: String!) {
    signOut(refreshToken: $refreshToken)
  }
`

type RefreshResponse = {
  refresh: { accessToken: string; refreshToken: string }
}

const user1 = {
  username: 'e2e_tester',
  password: 'e2e_tester_pass',
  email: 'e2e_tester@ete2.com',
}

const user2 = {
  username: 'e2e_tester_2',
  password: 'e2e_tester_pass_2',
  email: 'e2e_tester_2@ete2.com',
}

describe('Auth (e2e)', () => {
  let app: INestApplication

  let user: User
  let token: string
  let refreshToken: string

  let secondUser: User
  let secondToken: string
  let secondRefreshToken: string

  beforeAll(async () => {
    app = await createApp()
    await recreateUser(app, user1)
    await recreateUser(app, user2)
    const secondSigned = await loginUser(app, user2)
    secondUser = secondSigned.user
    secondToken = secondSigned.accessToken
    secondRefreshToken = secondSigned.refreshToken
  })

  afterAll(async () => {
    const response = await removeMe(app, token)
    const responseSecond = await removeMe(app, secondToken)
    expect(response.username).toEqual(user.username)
    expect(responseSecond.username).toEqual(secondUser.username)
    await app.close()
  })

  beforeEach(async () => {
    const signed = await loginUser(app, user1)
    user = signed.user
    token = signed.accessToken
    refreshToken = signed.refreshToken
  })

  it('User update', async () => {
    const usernameBefore = user.username
    const response = await updateUser(app, token, user.id).expectNoErrors()
    expect(response.data).not.toBeNull()
    const updatedUser = response.data!.updateUser
    user.avatar = updatedUser.avatar
    expect(updatedUser.avatar).toBe('https://example.com/avatar.png')
    expect(updatedUser.id).toBe(user.id)
    expect(updatedUser.username).toBe(usernameBefore)
  })

  it('Refresh token', async () => {
    const response = await request<RefreshResponse>(app.getHttpServer())
      .mutate(refreshQL)
      .variables({ refreshToken })
      .expectNoErrors()
    expect(response.data).not.toBeNull()
    const { accessToken, refreshToken: newRefreshToken } =
      response.data!.refresh
    expect(accessToken).not.toBeNull()
    expect(newRefreshToken).not.toBeNull()
  })

  it('Refresh token double times should be failure', async () => {
    await request<RefreshResponse>(app.getHttpServer())
      .mutate(refreshQL)
      .variables({ refreshToken: secondRefreshToken })
      .expectNoErrors()

    const response = await request<RefreshResponse>(app.getHttpServer())
      .mutate(refreshQL)
      .variables({ refreshToken: secondRefreshToken })

    expectNotFound(response)
  })

  it('Sign out', async () => {
    const response = await signOut().expectNoErrors()
    expect(response.data).not.toBeNull()
    expect(response.data!.signOut).toBe(true)
  })

  it('Sign out without auth should be failure', async () => {
    const response = await signOut('random')
    expect(response.data).toBeNull()
    expectUnauthorized(response)
  })

  it('Sign out twice should be failure', async () => {
    await signOut().expectNoErrors()
    const response = await signOut()
    expect(response.data).toBeNull()
    expectForbidden(response)
  })

  it('Get session', async () => {
    const response = await request<{
      sessions: { id: string; token: string; userId: string }[]
    }>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .query(sessionsQL)
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    expect(response.data!.sessions.length).toBeGreaterThan(0)
    const hashedToken = hashToken(refreshToken)
    const found = response.data!.sessions.find(
      (session) => session.token === hashedToken,
    )
    expect(found).not.toBeUndefined()
    expect(found!.userId).toBe(user.id)
    expect(found!.token).toBe(hashedToken)
  })

  function signOut(bearerToken = token) {
    return request<{ signOut: boolean }>(app.getHttpServer())
      .set('Authorization', `Bearer ${bearerToken}`)
      .mutate(signOutQL)
      .variables({ refreshToken })
  }
})

function updateUser(app: INestApplication, token: string, userId: string) {
  return request<{
    updateUser: { id: string; avatar: string; username: string }
  }>(app.getHttpServer())
    .set('Authorization', `Bearer ${token}`)
    .mutate(
      gql`
        mutation updateUser($input: UpdateUserInput!) {
          updateUser(updateUserInput: $input) {
            id
            avatar
            username
          }
        }
      `,
    )
    .variables({
      input: {
        id: userId,
        avatar: 'https://example.com/avatar.png',
      },
    })
}
