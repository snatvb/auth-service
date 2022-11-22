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
} from './helpers'

describe('Users (e2e)', () => {
  let app: INestApplication

  let user: User
  let token: string

  let secondUser: User
  let secondToken: string

  beforeAll(async () => {
    app = await createApp()
    await recreateUser(app)
    const signed = await loginUser(app)
    user = signed.user
    token = signed.accessToken

    const user2 = {
      username: 'e2e_tester_2',
      password: 'e2e_tester_pass_2',
      email: 'e2e_tester_2@ete2.com',
    }
    await recreateUser(app, user2)
    const secondSigned = await loginUser(app, user2)
    secondUser = secondSigned.user
    secondToken = secondSigned.accessToken
  })

  afterAll(async () => {
    const response = await removeMe(app, token)
    const responseSecond = await removeMe(app, secondToken)
    expect(response.username).toEqual(user.username)
    expect(responseSecond.username).toEqual(secondUser.username)
    await app.close()
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

  it('User update should failure', async () => {
    const response = await updateUser(app, token, secondUser.id)
    expectForbidden(response)
  })
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
