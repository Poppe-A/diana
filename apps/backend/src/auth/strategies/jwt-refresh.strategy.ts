import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload, RequestWithRefresh } from '../auth.types';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('REFRESH_JWT_SECRET');
    if (!secret) {
      throw new Error('REFRESH_JWT_SECRET is not set');
    }
    super({
      jwtFromRequest: (req: Request) => (req as RequestWithRefresh).cookies?.refreshToken ?? null,
      secretOrKey: secret,
      passReqToCallback: true,
    });
  }

  validate(req: RequestWithRefresh, payload: JwtPayload) {
    const token = req.cookies?.refreshToken;
    if (!token) {
      throw new UnauthorizedException('Missing refresh token');
    }
    const sub = payload.sub as unknown;
    const userId = typeof sub === 'string' ? parseInt(sub, 10) : sub;
    return { userId, email: payload.email };
  }
}
