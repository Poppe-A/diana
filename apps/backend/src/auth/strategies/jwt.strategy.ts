import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../auth.types';

function accessTokenExtractor(req: Request): string | null {
  const fromCookie = (req as Request & { cookies?: { accessToken?: string } }).cookies
    ?.accessToken;
  if (fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('ACCESS_JWT_SECRET');
    if (!secret) {
      throw new Error('ACCESS_JWT_SECRET is not set');
    }
    super({
      jwtFromRequest: accessTokenExtractor,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload) {
    const sub = payload.sub as unknown;
    const userId = typeof sub === 'string' ? parseInt(sub, 10) : sub;
    return { userId, email: payload.email };
  }
}
