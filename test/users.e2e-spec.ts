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
} from './helpers'

const adminUser1 = {
  username: 'admin_tester',
  password: 'admin_tester_pass',
  email: 'e2e_admin@ete2.com',
}

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

const userQL = gql`
  query user($id: String!) {
    user(id: $id) {
      id
      username
    }
  }
`

type ResponseUserQuery = {
  user: {
    id: string
    username: string
  }
}

const usersQL = gql`
  query users($skip: Int!, $take: Int!) {
    users(skip: $skip, take: $take) {
      id
      username
      roles
    }
  }
`

type ResponseUsersQuery = {
  users: Array<{
    id: string
    username: string
    roles: []
  }>
}

const promoteRoleDevQL = gql`
  mutation promoteRole($id: String!, $role: String!) {
    promoteRole__dev(id: $id, role: $role) {
      id
      username
      roles
    }
  }
`

type ResponsePromoteRoleDevQuery = {
  promoteRole: {
    id: string
    username: string
    roles: []
  }
}

describe('Users (e2e)', () => {
  let app: INestApplication

  let user: User
  let token: string

  let secondUser: User
  let secondToken: string

  let adminUser: User
  let adminToken: string

  beforeAll(async () => {
    app = await createApp()
    await recreateUser(app, user1)
    await recreateUser(app, user2)
    await recreateUser(app, adminUser1)

    const secondSigned = await loginUser(app, user2)
    secondUser = secondSigned.user
    secondToken = secondSigned.accessToken

    const signedAdmin = await loginUser(app, adminUser1)
    adminUser = signedAdmin.user
    adminToken = signedAdmin.accessToken
    await promoteAdminDev(app, adminUser.id).expectNoErrors()
  })

  afterAll(async () => {
    const response = await removeMe(app, token)
    const responseSecond = await removeMe(app, secondToken)
    const responseAdmin = await removeMe(app, adminToken)
    expect(response.username).toEqual(user.username)
    expect(responseSecond.username).toEqual(secondUser.username)
    expect(responseAdmin.username).toEqual(adminUser.username)
    await app.close()
  })

  beforeEach(async () => {
    const signed = await loginUser(app, user1)
    user = signed.user
    token = signed.accessToken
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

function promoteAdminDev(app: INestApplication, userId: string) {
  return request<ResponsePromoteRoleDevQuery>(app.getHttpServer())
    .mutate(promoteRoleDevQL)
    .variables({
      id: userId,
      role: 'admin',
    })
}
