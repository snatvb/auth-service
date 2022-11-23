import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { UsersService } from '~/users/users.service'
import { JwtService } from '@nestjs/jwt'
import { User } from '@prisma/client'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from 'prisma/prisma.service'
import { randomBytes, createHash } from 'crypto'

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
    const hash = hashToken(refreshToken)
    try {
      await this.prisma.token.delete({ where: { token: hash } })
      return true
    } catch (e) {
      throw new NotFoundException('Token not found')
    }
  }

  async terminateSession(userId: string, id: string) {
    const token = await this.prisma.token.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!token) {
      throw new NotFoundException('Token not found')
    }
    if (token.userId === userId) {
      await this.prisma.token.delete({ where: { id } })
      return true
    } else {
      throw new ForbiddenException('You can only terminate your own sessions')
    }
  }

  async signOutAll(username: string) {
    const user = await this.users.findOneByUsername(username)
    if (!user) {
      throw new ForbiddenException('User not found')
    }
    await this.prisma.token.deleteMany({ where: { userId: user.id } })
    return true
  }

  async signIn(username: string) {
    const { refreshToken, user, accessToken } = await this.issueToken(username)
    await this.prisma.token.create({
      data: {
        token: hashToken(refreshToken),
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
    const signedUser = convertSignedUser(user)
    const refreshToken = generateRefreshToken()
    const accessToken = this.jwt.sign(signedUser, { expiresIn: '1m' })
    return { refreshToken, user, accessToken }
  }

  async refresh(rt: string) {
    const hash = hashToken(rt)
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
      data: { token: generateRefreshToken() },
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

function generateRefreshToken() {
  const size = 32
  return Buffer.from(randomBytes(size).toString('ascii')).toString('base64')
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}
