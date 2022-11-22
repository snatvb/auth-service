import { BadRequestException, Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateUserInput } from './dto/create-user.input'
import { UpdateUserInput } from './dto/update-user.input'
import * as bcrypt from 'bcrypt'

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
    return this.prisma.user.findFirst({ where: { id } })
  }

  findOneByUsername(username: string) {
    return this.prisma.user.findFirst({ where: { username } })
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    const foundUser = await this.prisma.user.findUnique({
      where: {
        id,
      },
    })
    if (!foundUser) {
      throw new BadRequestException('User already exists')
    }
    foundUser.avatar = updateUserInput.avatar
    await this.prisma.user.update({ where: { id }, data: foundUser })
    return foundUser
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
}
