import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import { UserEntity } from '~/users/entities/user.entity'
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
import {
  RefreshResponse,
  refreshQL,
  sessionsQL,
  terminateSessionQL,
  signOutQL,
} from './helpers/gql'

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

  let user: UserEntity
  let token: string
  let refreshToken: string

  let secondUser: UserEntity
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
    expectNotFound(response)
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

  it('Terminate session', async () => {
    const responseSessions = await request<{
      sessions: { id: string; token: string; userId: string }[]
    }>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .query(sessionsQL)
      .expectNoErrors()

    expect(responseSessions.data).not.toBeNull()

    const firstSessionId = responseSessions.data!.sessions[0].id

    const response = await request<{
      terminateSession: string
    }>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .mutate(terminateSessionQL)
      .variables({ id: firstSessionId })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    expect(response.data!.terminateSession).toBe(true)
  })

  it('Terminate session should failure', async () => {
    const responseSessions = await request<{
      sessions: { id: string; token: string; userId: string }[]
    }>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .query(sessionsQL)
      .expectNoErrors()

    expect(responseSessions.data).not.toBeNull()

    const firstSessionId = responseSessions.data!.sessions[0].id

    const response = await request<{
      terminateSession: string
    }>(app.getHttpServer())
      .set('Authorization', `Bearer ${secondToken}`)
      .mutate(terminateSessionQL)
      .variables({ id: firstSessionId })

    expect(response.data).toBeNull()
    expectForbidden(response)
  })

  function signOut(bearerToken = token) {
    return request<{ signOut: boolean }>(app.getHttpServer())
      .set('Authorization', `Bearer ${bearerToken}`)
      .mutate(signOutQL)
      .variables({ refreshToken })
  }
})
