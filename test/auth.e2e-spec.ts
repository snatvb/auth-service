import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import { UserEntity } from '~/users/entities/user.entity'
import {
  createApp,
  signUp,
  expectForbidden,
  loginUser,
  removeMe,
  expectNotFound,
  expectUnauthorized,
  expectBadRequest,
  removeUsersByUsernames,
} from './helpers'
import { hashToken } from '~/auth/auth.service'
import {
  RefreshResponse,
  refreshQL,
  sessionsQL,
  terminateSessionQL,
  signOutQL,
  ResponseVerifyEmail,
  verifyEmailQL,
  changePasswordQL,
  issuePasswordRecoveryTokenDevQL,
  recoveryPasswordQL,
  ResponseChangePassword,
  ResponseIssuePasswordRecoveryTokenDev,
  ResponseRecoveryPassword,
  removeUserDevQL,
  ResponseRemoveUserDev,
  requestRecoveryPasswordQL,
  ResponseRequestRecoveryPassword,
  ResponseResendVerification,
  resendVerificationQL,
} from './helpers/gql'
import {
  clearSentEmailHistory,
  getSentEmailHistory,
} from './helpers/EmailMockService'
import { U } from '~/helpers'

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
    await removeUsersByUsernames(app, [user1.username, user2.username])
    await signUp(app, user2)
    const secondSigned = await loginUser(app, user2)
    secondUser = secondSigned.user
    secondToken = secondSigned.accessToken
    secondRefreshToken = secondSigned.refreshToken
  })

  afterAll(async () => {
    const responseSecond = await removeMe(app, secondToken)
    expect(responseSecond.username).toEqual(secondUser.username)
    await app.close()
  })

  beforeEach(async () => {
    await signUp(app, user1)
    const signed = await loginUser(app, user1)
    user = signed.user
    token = signed.accessToken
    refreshToken = signed.refreshToken
  })

  afterEach(async () => {
    await request<ResponseRemoveUserDev>(app.getHttpServer())
      .mutate(removeUserDevQL)
      .variables({
        id: user.id,
      })
      .expectNoErrors()
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

  it('Verify email', async () => {
    const sentToken = U.array.last(getSentEmailHistory())?.data?.token
    expect(typeof sentToken).toBe('string')
    const responseVerify = await request<ResponseVerifyEmail>(
      app.getHttpServer(),
    )
      .mutate(verifyEmailQL)
      .variables({ token: sentToken })
      .expectNoErrors()

    expect(responseVerify.data).not.toBeNull()
    expect(responseVerify.data!.verifyEmail.id).toBe(user.id)
    expect(responseVerify.data!.verifyEmail.emailVerified).toBe(true)
  })

  it('Verify email resend', async () => {
    const response = await request<ResponseResendVerification>(
      app.getHttpServer(),
    )
      .query(resendVerificationQL)
      .variables({ userId: user.id })
      .expectNoErrors()
    expect(response.data?.resendVerification).toBe(true)

    const sentToken = U.array.last(getSentEmailHistory())?.data?.token
    const responseVerify = await request<ResponseVerifyEmail>(
      app.getHttpServer(),
    )
      .mutate(verifyEmailQL)
      .variables({ token: sentToken })

    expect(responseVerify.data).not.toBeNull()
    expect(responseVerify.data!.verifyEmail.id).toBe(user.id)
    expect(responseVerify.data!.verifyEmail.emailVerified).toBe(true)
  })

  it('Verify email with invalid token should failure', async () => {
    const responseVerify = await request<ResponseVerifyEmail>(
      app.getHttpServer(),
    )
      .mutate(verifyEmailQL)
      .variables({ token: 'any' })

    expectBadRequest(responseVerify)
  })

  it('Change password', async () => {
    const response = await request<ResponseChangePassword>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .mutate(changePasswordQL)
      .variables({
        id: user.id,
        newPassword: 'new_password',
        oldPassword: user1.password,
      })

    expect(response.data).not.toBeNull()
    expect(response.data!.changePassword).toBe(true)
  })

  it('Change password should 401 non auth', async () => {
    const response = await request<ResponseChangePassword>(app.getHttpServer())
      .mutate(changePasswordQL)
      .variables({
        id: user.id,
        newPassword: 'new_password',
        oldPassword: user1.password,
      })

    expectUnauthorized(response)
  })

  it('Change password should 403', async () => {
    const response = await request<ResponseChangePassword>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .mutate(changePasswordQL)
      .variables({
        id: secondUser.id,
        newPassword: 'new_password',
        oldPassword: user1.password,
      })

    expectForbidden(response)
  })

  it('Change password with incorrect current password should fail', async () => {
    const response = await request<ResponseChangePassword>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .mutate(changePasswordQL)
      .variables({
        id: user.id,
        newPassword: 'new_password',
        oldPassword: "I'm not a password",
      })

    expect(response.data).toBeNull()
    expectBadRequest(response)
  })

  it('Recovery password', async () => {
    const responseToken = await request<ResponseIssuePasswordRecoveryTokenDev>(
      app.getHttpServer(),
    )
      .mutate(issuePasswordRecoveryTokenDevQL)
      .variables({
        id: user.id,
      })
      .expectNoErrors()

    expect(responseToken.data).not.toBeNull()
    const token = responseToken.data!.issuePasswordRecoveryToken
    expect(typeof token).toBe('string')

    const newPassword = 'new_password'
    const response = await request<ResponseRecoveryPassword>(
      app.getHttpServer(),
    )
      .mutate(recoveryPasswordQL)
      .variables({
        token,
        password: newPassword,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    expect(response.data!.recoveryPassword.username).toBe(user1.username)

    const responseLogin = await loginUser(app, {
      ...user1,
      password: newPassword,
    })
    expect(responseLogin.user.username).toBe(user1.username)
    expect(typeof responseLogin.accessToken).toBe('string')
    expect(typeof responseLogin.refreshToken).toBe('string')
  })

  it('Recovery password with invalid token should fail', async () => {
    const newPassword = 'new_password'
    const response = await request<ResponseRecoveryPassword>(
      app.getHttpServer(),
    )
      .mutate(recoveryPasswordQL)
      .variables({
        token: 'INVALID_TOKEN',
        password: newPassword,
      })

    expect(response.data).toBeNull()
    expectBadRequest(response)
  })

  it('Request recovery password', async () => {
    const response = await request<ResponseRequestRecoveryPassword>(
      app.getHttpServer(),
    )
      .mutate(requestRecoveryPasswordQL)
      .variables({
        email: user1.email,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    expect(response.data!.requestRecoveryPassword).toBe(true)

    const sent = U.array.last(getSentEmailHistory())
    expect(sent.to).toBe(user1.email)
    expect(sent.data!.username).toBe(user1.username)
    clearSentEmailHistory()
  })

  function signOut(bearerToken = token) {
    return request<{ signOut: boolean }>(app.getHttpServer())
      .set('Authorization', `Bearer ${bearerToken}`)
      .mutate(signOutQL)
      .variables({ refreshToken })
  }
})
