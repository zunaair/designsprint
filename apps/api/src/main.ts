import 'reflect-metadata';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { SentryExceptionFilter } from './common/filters/sentry-exception.filter';

async function bootstrap(): Promise<void> {
  // Initialize Sentry if DSN is configured
  const sentryDsn = process.env['SENTRY_DSN'];
  if (sentryDsn) {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env['NODE_ENV'] ?? 'development',
      tracesSampleRate: 0.2,
    });
    Logger.log('Sentry initialized', 'Bootstrap');
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors();

  // Register global Sentry exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapterHost.httpAdapter));

  await app.listen(process.env['PORT'] ?? 3001);
}

void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
