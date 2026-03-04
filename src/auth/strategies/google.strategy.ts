// src/auth/strategies/google.strategy.ts
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20'; // <-- Use Profile, removed VerifyCallback
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'missing_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'missing_secret',
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'missing_url',
      scope: ['email', 'profile'],
    });
  }

  // Notice we removed the 'done' callback entirely.
  // NestJS handles it automatically if you return a Promise.
  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    // We use optional chaining (?.) so your app doesn't crash
    // if a user has strict privacy settings on their Google account.
    const user = {
      email: emails?.[0]?.value || '',
      fullName: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      picture: photos?.[0]?.value || '',
      accessToken,
    };

    // The "NestJS Way": just return the object!
    return Promise.resolve(user);
  }
}
