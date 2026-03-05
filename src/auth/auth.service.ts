import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
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
  async googleLogin(req: { user?: { email: string; fullName: string } }) {
    if (!req.user) {
      throw new UnauthorizedException('No user from Google');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: req.user.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: req.user.email,
          fullName: `${req.user.fullName}`,
          provider: 'google',
        },
      });
    }

    return this.login(user);
  }

  // 4. Register (Local)
  async register(data: Prisma.UserCreateInput) {
    if (!data.password) {
      throw new BadRequestException('Password is required');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        provider: 'local',
      },
    });
  }

  // 5. Forgot Password
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      return {
        message: 'If that email exists, a password reset link has been sent.',
      };
    }

    const payload = { email: user.email, sub: user.id };
    const resetToken = this.jwtService.sign(payload, { expiresIn: '15m' });

    console.log(`Password reset token for ${email}: ${resetToken}`);

    return {
      message: ',f that email exists, a password reset link has been sent.',
      // Note: Remove `resetToken` from the return object in production!
      resetToken,
    };
  }

  // 6. Reset Password
  async resetPassword(token: string, newPassword: string) {
    try {
      // Verify the token (throws an error if expired or invalid)
      const payload = this.jwtService.verify(token);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });
      if (!user) {
        throw new BadRequestException('User no longer exists');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update the user's password in the database
      await this.prisma.user.update({
        where: { id: user.id },

        data: { password: hashedPassword },
      });

      return { message: 'Password has been successfully reset' };
    } catch (error) {
      throw error;
    }
  }
}
