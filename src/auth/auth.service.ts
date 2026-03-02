import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User, Prisma } from '@prisma/client';

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // 1. Validate Local User
  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Check if user exists AND if password matches
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  // 2. Generate Token (Login)
  login(user: UserWithoutPassword | User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 3. Register/Login Google User
  async googleLogin(req: {
    user?: { email: string; firstName: string; lastName: string };
  }) {
    if (!req.user) {
      return 'No user from google';
    }

    // Check if user exists in DB, if not, create them
    let user = await this.prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: req.user.email,
          firstName: `${req.user.firstName}`,
          lastName: `${req.user.lastName}`,
          provider: 'google',
        },
      });
    }

    return this.login(user); // Generate JWT for the Google user
  }

  // 4. Register (Local) - Helper to hash password
  async register(data: Prisma.UserCreateInput) {
    if (!data.password) {
      throw new UnauthorizedException('Password is required');
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        provider: 'local',
      },
    });
  }
}
