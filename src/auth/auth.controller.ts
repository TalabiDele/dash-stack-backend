import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserDto } from '../users/dto/create-user.dto';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

@ApiTags('auth') // Groups these endpoints together in your Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 1. REGISTRATION
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  // 2. LOCAL LOGIN (Email/Password)
  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 201, description: 'Returns the JWT access token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  // 3. GOOGLE OAUTH INITIATION
  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  googleAuth() {
    // You don't need any code here. The Google Guard automatically
    // redirects the user to the Google login screen.
  }

  // 4. GOOGLE OAUTH CALLBACK
  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback URL' })
  async googleAuthRedirect(@Request() req: any, @Res() res: Response) {
    // Google sends the user back here. We generate the JWT.
    const { access_token } = await this.authService.googleLogin(req);

    // Redirect back to Next.js with the token so Next.js can set the HTTP-Only cookie
    res.redirect(`http://localhost:3000/oauth/callback?token=${access_token}`);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send a password reset email' })
  forgotPassword() {
    // TODO: We will generate a token here and send an email
    return { message: 'Forgot password endpoint hit. Logic coming soon!' };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the email token' })
  resetPassword() {
    // TODO: We will verify the token and update the password in Prisma
    return { message: 'Reset password endpoint hit. Logic coming soon!' };
  }
}
