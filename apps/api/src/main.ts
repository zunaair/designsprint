import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
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
