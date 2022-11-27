import gql from 'graphql-tag'
import { UserEntity } from '~/users/entities/user.entity'

export const createUserQL = gql`
  mutation createUser($input: CreateUserInput!) {
    createUser(createUserInput: $input) {
      id
      username
    }
  }
`

export type ResponseCreateUser = {
  createUser: { id: string; username: string }
}

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

export const removeUserDevQL = gql`
  mutation removeUser($id: String!) {
    removeUser: removeUser__dev(id: $id) {
      id
      username
    }
  }
`

export type ResponseRemoveUserDev = {
  removeUser: {
    id: string
    username: string
  }
}

export const removeUsersByUsernamesDevQL = gql`
  mutation removeUsersByUsernames__dev($usernames: [String!]!) {
    removeByUsernames: removeUsersByUsernames__dev(usernames: $usernames)
  }
`

export type ResponseRemoveUsersByUsernames = {
  removeByUsernames: number
}

export const changePasswordQL = gql`
  mutation changePassword(
    $id: String!
    $oldPassword: String!
    $newPassword: String!
  ) {
    changePassword(
      id: $id
      newPassword: $newPassword
      oldPassword: $oldPassword
    )
  }
`

export type ResponseChangePassword = {
  changePassword: boolean
}

export const issueEmailVerifyTokenDevQL = gql`
  mutation issueEmailVerifyToken__dev($id: String!) {
    issueEmailVerifyToken: issueEmailVerifyToken__dev(id: $id)
  }
`

export type ResponseIssueEmailVerifyTokenDev = {
  issueEmailVerifyToken: string
}

export const verifyEmailQL = gql`
  mutation verifyEmail($token: String!) {
    verifyEmail(token: $token) {
      id
      email
      emailVerified
    }
  }
`

export type ResponseVerifyEmail = {
  verifyEmail: {
    id: string
    email: string
    emailVerified: boolean
  }
}

export const issuePasswordRecoveryTokenDevQL = gql`
  mutation issuePasswordVerifyToken__dev($id: String!) {
    issuePasswordRecoveryToken: issuePasswordVerifyToken__dev(id: $id)
  }
`

export type ResponseIssuePasswordRecoveryTokenDev = {
  issuePasswordRecoveryToken: string
}

export const recoveryPasswordQL = gql`
  mutation recoveryPassword($token: String!, $password: String!) {
    recoveryPassword(token: $token, password: $password) {
      id
      username
    }
  }
`

export type ResponseRecoveryPassword = {
  recoveryPassword: {
    id: string
    username: string
  }
}

export const requestRecoveryPasswordQL = gql`
  query requestRecoveryPassword($email: String!) {
    requestRecoveryPassword(email: $email)
  }
`

export type ResponseRequestRecoveryPassword = {
  requestRecoveryPassword: boolean
}

export const signUpQL = gql`
  mutation signUp($input: SignUpInput!) {
    signUp(signUpInput: $input) {
      id
      email
      emailVerified
      avatar
      username
      updatedAt
    }
  }
`

export type ResponseSignUp = {
  signUp: {
    id: string
    email: string
    emailVerified: boolean
    avatar: string
    username: string
    updatedAt: Date
  }
}

export const resendVerificationQL = gql`
  query resendVerification($userId: String!) {
    resendVerification(userId: $userId)
  }
`

export type ResponseResendVerification = {
  resendVerification: boolean
}
