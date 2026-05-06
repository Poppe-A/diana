import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');

  /**
   * Origines CORS : comparaison **stricte** avec le header `Origin` du navigateur.
   * Pièges fréquents alors que le `.env` semble correct :
   * - Tu ouvres `http://127.0.0.1:5273` mais ALLOWED_ORIGINS = `http://localhost:5273` → refusé (deux origines différentes).
   * - Slash final : `http://localhost:5273/` dans `.env` alors que le navigateur envoie sans slash → refusé (on normalise en prod).
   * En **dev**, on autorise toute origine (`callback true`) pour éviter ces faux négatifs. En **prod**, uniquement la liste ALLOWED_ORIGINS normalisée.
   */
  const normalizeOrigin = (value: string) => value.trim().replace(/\/+$/, '');

  const allowedProductionOrigins =
    config
      .get<string>('ALLOWED_ORIGINS')
      ?.split(',')
      .map(normalizeOrigin)
      .filter(Boolean) ?? [];

  const isProduction = config.get<string>('NODE_ENV') === 'production';
  const logCors = config.get<string>('LOG_CORS') === '1';

  app.enableCors({
    origin: (origin, callback) => {
      if (logCors) {
        // eslint-disable-next-line no-console -- diagnostic volontaire (LOG_CORS=1)
        console.log(
          `[CORS] NODE_ENV=${isProduction ? 'production' : 'development'} Request-Origin=${origin ?? '(none)'}`,
        );
      }

      if (!isProduction) {
        callback(null, true);
        return;
      }

      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedProductionOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(config.get<string>('PORT') ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
