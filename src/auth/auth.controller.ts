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

@ApiTags('auth') // Groups these endpoints together in your Swagger UI
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // 1. REGISTRATION
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  register(@Body() createUserDto: CreateUserDto) {
    // We reuse the CreateUserDto from Drill 1 so we get automatic data validation!
    return this.authService.register(createUserDto);
  }

  // 2. LOCAL LOGIN (Email/Password)
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 201, description: 'Returns the JWT access token.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Request() req) {
    // The LocalAuthGuard automatically intercepts the request, hashes the password,
    // and checks the database BEFORE this code runs.
    // If it succeeds, it injects the user into req.user.
    return this.authService.login(req.user);
  }

  // 3. GOOGLE OAUTH INITIATION
  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Initiate Google OAuth login flow' })
  googleAuth() {
    // You don't need any code here. The Google Guard automatically
    // redirects the user to the Google login screen.
  }

  // 4. GOOGLE OAUTH CALLBACK
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth callback URL' })
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    // Google sends the user back here. We generate the JWT.
    const { access_token } = await this.authService.googleLogin(req);

    // Redirect back to Next.js with the token so Next.js can set the HTTP-Only cookie
    res.redirect(`http://localhost:3000/oauth/callback?token=${access_token}`);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Send a password reset email' })
  forgotPassword(@Body('email') email: string) {
    // TODO: We will generate a token here and send an email
    return { message: 'Forgot password endpoint hit. Logic coming soon!' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using the email token' })
  resetPassword(@Body() body: any) {
    // TODO: We will verify the token and update the password in Prisma
    return { message: 'Reset password endpoint hit. Logic coming soon!' };
  }
}
