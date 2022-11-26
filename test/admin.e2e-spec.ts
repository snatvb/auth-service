import { INestApplication } from '@nestjs/common'
import request from 'supertest-graphql'
import gql from 'graphql-tag'
import { UserEntity } from '~/users/entities/user.entity'
import { createApp, recreateUser, loginUser, removeMe } from './helpers'
import {
  refreshQL,
  RefreshResponse,
  ResponseUpdateFullUser,
  updateFullUserQL,
} from './helpers/gql'

const adminUser1 = {
  username: 'admin_tester',
  password: 'admin_tester_pass',
  email: 'e2e_admin@ete2.com',
}

const user1 = {
  username: 'non_admin_tester',
  password: 'non_admin_tester_pass',
  email: 'non_admin_tester@ete2.com',
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
  mutation ($id: String!, $role: String!) {
    promoteRole: promoteRole__dev(id: $id, role: $role) {
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

describe('Users admin (e2e)', () => {
  let app: INestApplication

  let user: Pick<UserEntity, 'id' | 'username' | 'roles'>
  let token: string

  let adminUser: Pick<UserEntity, 'id' | 'username' | 'roles'>
  let adminToken: string

  beforeAll(async () => {
    app = await createApp()
    await recreateUser(app, user1)
    await recreateUser(app, adminUser1)

    const signedAdmin = await loginUser(app, adminUser1)
    adminUser = signedAdmin.user
    const tempAdminToken = signedAdmin.accessToken
    const adminResponse = await promoteAdminDev(
      app,
      adminUser.id,
    ).expectNoErrors()
    expect(adminResponse.data!.promoteRole.roles).toContain('admin')

    const responseRefresh = await request<RefreshResponse>(app.getHttpServer())
      .set('Authorization', `Bearer ${tempAdminToken}`)
      .mutate(refreshQL)
      .variables({
        refreshToken: signedAdmin.refreshToken,
      })
      .expectNoErrors()

    adminToken = responseRefresh.data!.refresh.accessToken
  })

  afterAll(async () => {
    const response = await removeMe(app, token)
    const responseAdmin = await removeMe(app, adminToken)
    expect(response.username).toEqual(user.username)
    expect(responseAdmin.username).toEqual(adminUser.username)
    await app.close()
  })

  beforeEach(async () => {
    const signed = await loginUser(app, user1)
    user = signed.user
    token = signed.accessToken
  })

  it('Get users by admin', async () => {
    const response = await request<ResponseUsersQuery>(app.getHttpServer())
      .set('Authorization', `Bearer ${adminToken}`)
      .query(usersQL)
      .variables({
        skip: 0,
        take: 10,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    const users = response.data!.users
    expect(users.length).toBeGreaterThan(0)
  })

  it('Update full user', async () => {
    const newUpdatedFields = {
      username: 'new_username',
      email: 'new_username_email@rrrr.rr',
      avatar: 'new_avatar',
      emailVerified: true,
    }
    const response = await request<ResponseUpdateFullUser>(app.getHttpServer())
      .set('Authorization', `Bearer ${adminToken}`)
      .mutate(updateFullUserQL)
      .variables({
        id: user.id,
        input: newUpdatedFields,
      })
      .expectNoErrors()

    expect(response.data).not.toBeNull()
    const updated = response.data!.updateFullUser
    expect(updated.username).toEqual(newUpdatedFields.username)
    expect(updated.email).toEqual(newUpdatedFields.email)
    expect(updated.avatar).toEqual(newUpdatedFields.avatar)
    expect(updated.emailVerified).toEqual(newUpdatedFields.emailVerified)
    user = { ...user, ...newUpdatedFields }
  })
})

function promoteAdminDev(app: INestApplication, userId: string) {
  return request<ResponsePromoteRoleDevQuery>(app.getHttpServer())
    .mutate(promoteRoleDevQL)
    .variables({
      id: userId,
      role: 'admin',
    })
}
