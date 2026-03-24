import 'reflect-metadata';
import { execSync } from 'child_process';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // Auto-create database tables on startup (safe to run multiple times)
  try {
    console.log('Running prisma db push...');
    execSync('npx prisma db push --skip-generate --accept-data-loss', {
      stdio: 'inherit',
      timeout: 30000,
    });
    console.log('Database schema synced.');
  } catch (e) {
    console.warn('prisma db push failed (tables may already exist):', (e as Error).message);
  }

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api', { exclude: ['/'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors();
  await app.listen(process.env['PORT'] ?? 3001);
}

void bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
