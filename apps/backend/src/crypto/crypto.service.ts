import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const HASH = 'sha256';

@Injectable()
export class CryptoService {
  constructor(private readonly configService: ConfigService) {}

  encryptText(plain: string): string {
    const key = this.getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plain, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decryptText(payload: string | null): string | null {
    if (!payload) return null;
    try {
      const key = this.getKey();
      const [ivHex, authTagHex, encryptedText] = payload.split(':');
      if (!ivHex || !authTagHex || !encryptedText) return null;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch {
      return null;
    }
  }

  private getKey(): Buffer {
    const secret = this.configService.get<string>('HEALTH_DATA_SECRET');
    if (!secret) {
      throw new Error('HEALTH_DATA_SECRET is not set');
    }
    return crypto.createHash(HASH).update(secret).digest();
  }
}
