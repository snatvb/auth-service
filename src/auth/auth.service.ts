import { Injectable, NotFoundException } from '@nestjs/common'
import { UsersService } from '~/users/users.service'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { PrismaService } from 'prisma/prisma.service'
import { ForbiddenError } from 'apollo-server-express'

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.users.findOneByUsername(username)
    if (user && (await this.users.validatePassword(password, user.password))) {
      return prepareUser(user)
    }
    return null
  }

  async signOut(refreshToken: string) {
    const hash = await hashToken(refreshToken)
    await this.prisma.token.delete({ where: { token: hash } })
    return true
  }

  async signOutAll(username: string) {
    const user = await this.users.findOneByUsername(username)
    if (!user) {
      throw new ForbiddenError('User not found')
    }
    await this.prisma.token.deleteMany({ where: { userId: user.id } })
    return true
  }

  async signIn(username: string) {
    const { refreshToken, user, accessToken } = await this.issueToken(username)
    await this.prisma.token.create({
      data: {
        token: await hashToken(refreshToken),
        userId: user.id,
      },
    })

    return {
      accessToken,
      refreshToken,
      user,
    }
  }

  private async issueToken(username: string) {
    const userFromDB = await this.users.findOneByUsername(username)
    if (!userFromDB) {
      throw new NotFoundException('User not found')
    }
    const user = prepareUser(userFromDB)
    const secretRt = this.config.get<string>('JWT_RT_SECRET')
    const signedUser = convertSignedUser(user)
    const refreshToken = this.jwt.sign(signedUser, {
      secret: secretRt,
      expiresIn: '7d',
    })
    const accessToken = this.jwt.sign(signedUser, { expiresIn: '1m' })
    return { refreshToken, user, accessToken }
  }

  async refresh(rt: string) {
    const hash = await hashToken(rt)
    const token = await this.prisma.token.findUnique({
      where: { token: hash },
      include: { user: true },
    })
    if (!token) {
      throw new NotFoundException('Token not found')
    }
    const { refreshToken, user, accessToken } = await this.issueToken(
      token.user.username,
    )
    await this.prisma.token.update({
      where: { token: hash },
      data: { token: await hashToken(refreshToken) },
    })

    return { accessToken, refreshToken, user }
  }

  async findSessions(userId: string) {
    return this.prisma.token.findMany({
      where: { userId },
    })
  }
}

function prepareUser(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...result } = user
  return result
}

export type SignedUser = Omit<ReturnType<typeof prepareUser>, 'updatedAt'>

function convertSignedUser(user: ReturnType<typeof prepareUser>): SignedUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt, ...result } = user
  return result
}

function hashToken(token: string) {
  return bcrypt.hash(token, 10)
}
