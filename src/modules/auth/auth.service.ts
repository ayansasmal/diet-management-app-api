import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../database/prisma.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleCallbackDto } from './dto/google-callback.dto';
import { AuthResponseDto, UserDto } from './dto/auth-response.dto';

/**
 * Authentication service handling Google OAuth login.
 * Supports both ID token verification and OAuth 2.0 code exchange flows.
 */
@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  /**
   * Admin emails that automatically receive admin role on first login.
   */
  private readonly ADMIN_EMAILS = ['ayan.m.sasmal@gmail.com'];

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('app.google.clientId'),
      this.configService.get<string>('app.google.clientSecret'),
    );
  }

  /**
   * Handle Google OAuth 2.0 callback - exchange authorization code for token.
   *
   * Flow:
   * 1. Exchange authorization code for access token (and ID token)
   * 2. Use ID token to get user info (sub, email, name, picture)
   * 3. Find existing user by googleId or create new user
   * 4. Generate app JWT and return auth response
   *
   * @param callbackDto - Contains the authorization code from Google
   * @returns Auth response with JWT token and user data
   * @throws UnauthorizedException if code exchange fails
   */
  async googleCallback(callbackDto: GoogleCallbackDto): Promise<AuthResponseDto> {
    const { code } = callbackDto;

    try {
      // Exchange authorization code for tokens
      const { tokens } = await this.googleClient.getToken({
        code,
        redirect_uri: `${this.configService.get<string>('app.frontendUrl')}/auth/callback`,
      });

      // Verify the ID token using the tokens we got
      const ticket = await this.googleClient.verifyIdToken({
        idToken: tokens.id_token as string,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.sub || !payload.email) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const { sub: googleId, email, name, picture } = payload;

      // Find existing user or create new one
      let user = await this.prisma.user.findUnique({
        where: { googleId },
        include: { profile: true },
      });

      if (!user) {
        const role = this.ADMIN_EMAILS.includes(email) ? 'admin' : 'user';

        user = await this.prisma.user.create({
          data: {
            googleId,
            email,
            name: name || null,
            picture: picture || null,
            role,
          },
          include: { profile: true },
        });
      } else {
        user = await this.prisma.user.update({
          where: { googleId },
          data: {
            email,
            name: name || user.name,
            picture: picture || user.picture,
          },
          include: { profile: true },
        });
      }

      return this.generateAuthResponse(user);
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new UnauthorizedException('Invalid authorization code or token exchange failed');
    }
  }

  /**
   * Authenticate user with Google ID token.
   *
   * Flow:
   * 1. Verify the Google ID token cryptographically
   * 2. Extract user info (sub, email, name, picture)
   * 3. Find existing user by googleId or create new user
   * 4. Generate app JWT and return auth response
   *
   * @param googleAuthDto - Contains the Google credential (ID token)
   * @returns Auth response with JWT token and user data
   * @throws UnauthorizedException if token is invalid
   */
  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    const { credential } = googleAuthDto;

    // 1. Verify the Google ID token
    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
      });

      payload = ticket.getPayload();

      // Verify payload exists
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!payload || !payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid Google token payload');
    }

    const { sub: googleId, email, name, picture } = payload;

    // 2. Find existing user by googleId or create new user
    let user = await this.prisma.user.findUnique({
      where: { googleId },
      include: { profile: true },
    });

    if (!user) {
      // Determine role based on email (admin emails get admin role)
      const role = this.ADMIN_EMAILS.includes(email) ? 'admin' : 'user';

      user = await this.prisma.user.create({
        data: {
          googleId,
          email,
          name: name || null,
          picture: picture || null,
          role,
        },
        include: { profile: true },
      });
    } else {
      // Update user info from Google profile (name/picture may change)
      user = await this.prisma.user.update({
        where: { googleId },
        data: {
          email, // Email might change in Google account
          name: name || user.name,
          picture: picture || user.picture,
        },
        include: { profile: true },
      });
    }

    // 3. Generate app JWT and return
    return this.generateAuthResponse(user);
  }

  /**
   * Get current user profile.
   *
   * @param userId - User ID from JWT
   * @returns User data
   * @throws UnauthorizedException if user not found
   */
  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name || undefined,
      picture: user.picture || undefined,
      role: user.role,
      hasProfile: !!user.profile,
      createdAt: user.createdAt,
    };
  }

  /**
   * Generate JWT token and auth response.
   */
  private generateAuthResponse(
    user: {
      id: string;
      email: string;
      name: string | null;
      picture: string | null;
      role: string;
      profile?: unknown;
      createdAt: Date;
    },
  ): AuthResponseDto {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const expiresIn = this.configService.get<string>('app.jwt.expiresIn');
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiresIn(expiresIn || '24h'),
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        picture: user.picture || undefined,
        role: user.role,
        hasProfile: !!user.profile,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Parse JWT expiration string to seconds.
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 86400; // Default 24h

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };

    return value * (multipliers[unit] || 3600);
  }
}
