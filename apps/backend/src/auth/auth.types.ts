import { Request } from 'express';

export interface RegisterUserDto {
  email: string;
  password: string;
}

export interface JwtPayload {
  sub: number | string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestWithRefresh extends Request {
  cookies: {
    refreshToken?: string;
    accessToken?: string;
  };
  user: { userId: number; email: string };
}
