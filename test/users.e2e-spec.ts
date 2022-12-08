import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import { U } from '~/helpers'
import { UserEntity } from '~/users/entities/user.entity'
import {
  createApp,
  signUp,
  expectForbidden,
  loginUser,
  removeMe,
  expectNotFound,
  updateUser,
  removeUsersByUsernames,
} from './helpers'
import { getSentEmailHistory } from './helpers/EmailMockService'
import {
  ResponseUserQuery,
  userQL,
  ResponseUsersQuery,
  usersQL,
  removeUserDevQL,
  ResponseRemoveUserDev,
  requestChangeEmailQL,
  ResponseRequestChangeEmail,
  changeEmailQL,
  ResponseChangeEmail,
} from './helpers/gql'

const user1 = {
  username: 'e2e_tester_users',
  password: 'e2e_tester_users_pass',
  email: 'e2e_tester_users@ete2.com',
}

const user2 = {
  username: 'e2e_tester_2_users',
  password: 'e2e_tester_pass_2_users',
  email: 'e2e_tester_2_users@ete2.com',
}

describe('Users (e2e)', () => {
  let app: INestApplication

  let user: UserEntity
  let token: string

  let secondUser: UserEntity
  let secondToken: string

  beforeAll(async () => {
    app = await createApp()
    await removeUsersByUsernames(app, [user1.username, user2.username])
    await signUp(app, user2)

    const secondSigned = await loginUser(app, user2)
    secondUser = secondSigned.user
    secondToken = secondSigned.accessToken
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
  })

  afterEach(async () => {
    await request<ResponseRemoveUserDev>(app.getHttpServer())
      .mutate(removeUserDevQL)
      .variables({
        id: user.id,
      })
      .expectNoErrors()
  })

  it('User update', async () => {
    const usernameBefore = user.username
    const response = await updateUser(app, token, user.id).expectNoErrors()
    expect(response.data).not.toBeNull()
    const updatedUser = response.data!.updateUser
    expect(updatedUser.avatar).toBe('https://example.com/avatar.png')
    expect(updatedUser.id).toBe(user.id)
    expect(updatedUser.username).toBe(usernameBefore)
    expect(user.updatedAt).not.toBe(updatedUser.updatedAt)
  })

  it('User update should failure', async () => {
    const response = await updateUser(app, token, secondUser.id)
    expectForbidden(response)
  })

  it('Get user by id', async () => {
    const response = await request<ResponseUserQuery>(app.getHttpServer())
      .query(userQL)
      .variables({
        id: user.id,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    const userResponse = response.data!.user
    expect(userResponse.id).toBe(user.id)
    expect(userResponse.username).toBe(user.username)
  })

  it('Get second user by id', async () => {
    const response = await request<ResponseUserQuery>(app.getHttpServer())
      .query(userQL)
      .variables({
        id: secondUser.id,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    const userResponse = response.data!.user
    expect(userResponse.id).toBe(secondUser.id)
    expect(userResponse.username).toBe(secondUser.username)
  })

  it('Get user should 404', async () => {
    const response = await request<ResponseUserQuery>(app.getHttpServer())
      .query(userQL)
      .variables({
        id: 'INVALID_ID',
      })

    expect(response.data).toBeNull()
    expectNotFound(response)
  })

  it('Get users should 403', async () => {
    const response = await request<ResponseUsersQuery>(app.getHttpServer())
      .set('Authorization', `Bearer ${token}`)
      .query(usersQL)
      .variables({
        skip: 0,
        take: 10,
      })

    expectForbidden(response)
  })

  it('Change email', async () => {
    const newEmail = 'changed_email_test@hhe.eez'
    const responseRequest = await request<ResponseRequestChangeEmail>(
      app.getHttpServer(),
    )
      .set('Authorization', `Bearer ${token}`)
      .query(requestChangeEmailQL)
      .variables({
        id: user.id,
        newEmail,
      })
      .expectNoErrors()

    expect(responseRequest.data).not.toBeNull()
    expect(responseRequest.data!.requestChangeEmail).toBe(true)

    const sentToken = U.array.last(getSentEmailHistory())
    expect(typeof sentToken.data!.token).toBe('string')
    expect(sentToken.data!.link.includes('change')).toBe(true)
    expect(sentToken.templateName).toBe('change-email')

    const responseChange = await request<ResponseChangeEmail>(
      app.getHttpServer(),
    )
      .set('Authorization', `Bearer ${token}`)
      .mutate(changeEmailQL)
      .variables({
        token: sentToken.data!.token,
      })
      .expectNoErrors()

    expect(responseChange.data).not.toBeNull()
    expect(responseChange.data!.changeEmail.email).toBe(newEmail)
    expect(responseChange.data!.changeEmail.username).toBe(user1.username)

    const sentVerify = U.array.last(getSentEmailHistory()) //?
    expect(sentVerify.data!.link.includes('verify')).toBe(true)
    expect(sentVerify.templateName).toBe('verify-email')
  })
})
