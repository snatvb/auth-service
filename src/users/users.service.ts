import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserInput } from './dto/create-user.input'
import * as bcrypt from 'bcrypt'
import { User } from '@prisma/client'

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserInput: CreateUserInput) {
    const password = await this.hashPassword(createUserInput.password)
    const foundUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserInput.email },
          { username: createUserInput.username },
        ],
      },
    })

    if (foundUser) {
      throw new BadRequestException('User already exists')
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...user } = await this.prisma.user.create({
      data: {
        ...createUserInput,
        password,
      },
    })
    return user
  }

  findAll(skip: number, take: number) {
    return this.prisma.user.findMany({ skip, take })
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } })
  }

  async update(
    id: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    { id: _, ...updateUserInput }: Partial<User>,
  ): Promise<User> {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
    if (!foundUser) {
      throw new BadRequestException('User already exists')
    }
    if ('password' in updateUserInput && updateUserInput.password) {
      updateUserInput.password = await this.hashPassword(
        updateUserInput.password,
      )
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateUserInput,
    })
    return updated
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } })
  }

  hashPassword(password: string) {
    return bcrypt.hash(password, 10)
  }

  validatePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash)
  }

  async promoteRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { roles: true },
    })
    if (!user) {
      throw new BadRequestException(`User with id ${id} not found`)
    }

    if (user.roles.includes(role)) {
      throw new BadRequestException(`User already has role ${role}`)
    }

    return this.prisma.user.update({
      where: { id },
      data: { roles: { set: [...user.roles, role] } },
    })
  }
}
