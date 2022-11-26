import gql from 'graphql-tag'
import { UserEntity } from '~/users/entities/user.entity'

export const refreshQL = gql`
  mutation refresh($refreshToken: String!) {
    refresh(refreshToken: $refreshToken) {
      accessToken
      refreshToken
      user {
        id
        username
        roles
      }
    }
  }
`

export type RefreshResponse = {
  refresh: {
    accessToken: string
    refreshToken: string
    user: Pick<UserEntity, 'id' | 'username' | 'roles'>
  }
}

export const sessionsQL = gql`
  {
    sessions {
      id
      token
      userId
    }
  }
`

export const terminateSessionQL = gql`
  mutation terminateSession($id: String!) {
    terminateSession(id: $id)
  }
`

export const signOutQL = gql`
  mutation signOut($refreshToken: String!) {
    signOut(refreshToken: $refreshToken)
  }
`

export const userQL = gql`
  query user($id: String!) {
    user(id: $id) {
      id
      username
    }
  }
`

export type ResponseUserQuery = {
  user: {
    id: string
    username: string
  }
}

export const usersQL = gql`
  query users($skip: Int!, $take: Int!) {
    users(skip: $skip, take: $take) {
      id
      username
      roles
    }
  }
`

export type ResponseUsersQuery = {
  users: Array<{
    id: string
    username: string
    roles: []
  }>
}

export const promoteRoleDevQL = gql`
  mutation ($id: String!, $role: String!) {
    promoteRole: promoteRole__dev(id: $id, role: $role) {
      id
      username
      roles
    }
  }
`

export type ResponsePromoteRoleDevQuery = {
  promoteRole: {
    id: string
    username: string
    roles: []
  }
}

export const updateUserQL = gql`
  mutation updateUser($id: String!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      id
      avatar
      username
      updatedAt
    }
  }
`

export type ResponseUpdateUser = {
  updateUser: {
    id: string
    avatar: string
    username: string
    updatedAt: string
  }
}

export const updateFullUserQL = gql`
  mutation updateFullUser($id: String!, $input: FullUpdateUserInput!) {
    updateFullUser(id: $id, input: $input) {
      id
      email
      emailVerified
      avatar
      username
      updatedAt
    }
  }
`

export type ResponseUpdateFullUser = {
  updateFullUser: {
    id: string
    email: string
    emailVerified: boolean
    avatar: string
    username: string
    updatedAt: Date
  }
}
