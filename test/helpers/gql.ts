import gql from 'graphql-tag'
import { User } from '~/users/entities/user.entity'

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
    user: Pick<User, 'id' | 'username' | 'roles'>
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
