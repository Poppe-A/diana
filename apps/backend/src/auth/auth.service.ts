import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dto/register.dto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private cookieOptions(maxAge: number) {
    const prod = this.isProduction();
    return {
      httpOnly: true,
      path: '/',
      secure: prod,
      sameSite: (prod ? 'strict' : 'lax') as const,
      maxAge,
    };
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('accessToken', accessToken, this.cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, this.cookieOptions(7 * 24 * 60 * 60 * 1000));
  }

  clearAuthCookies(res: Response) {
    const prod = this.isProduction();
    const base = {
      httpOnly: true,
      path: '/',
      secure: prod,
      sameSite: (prod ? 'strict' : 'lax') as const,
      expires: new Date(0),
    };
    res.cookie('accessToken', '', base);
    res.cookie('refreshToken', '', base);
  }

  async register(dto: RegisterDto) {
    const existing = await this.userService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.userService.create({ email: dto.email, password: hashedPassword });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string, res: Response) {
    const user = await this.userService.findByEmail(email, true);
    if (!user?.password) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const { accessToken, refreshToken } = await this.generateAuthTokens(user.id, user.email);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { id: user.id, email: user.email };
  }

  async generateAuthTokens(userId: number, email: string) {
    const accessSecret = this.configService.get<string>('ACCESS_JWT_SECRET');
    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET');
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT secrets are not configured');
    }
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: accessSecret, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: refreshSecret, expiresIn: '7d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  async refreshTokens(res: Response, userId: number, email: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const { accessToken, refreshToken } = await this.generateAuthTokens(userId, user.email);
    this.setAuthCookies(res, accessToken, refreshToken);
    return { id: user.id, email: user.email };
  }
}
