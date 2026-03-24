import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    const maxRetries = 5;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Prisma connected to database');
        await this.ensureTables();
        return;
      } catch (err) {
        this.logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${(err as Error).message}`);
        if (attempt === maxRetries) {
          this.logger.error('All database connection attempts failed. Starting without database.');
          return;
        }
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }

  private async ensureTables(): Promise<void> {
    try {
      // Check if Scan table exists
      const tables = await this.$queryRaw<Array<{ tablename: string }>>`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Scan'
      `;
      if (tables.length === 0) {
        this.logger.log('Creating database tables...');
        await this.$executeRawUnsafe(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScanStatus') THEN
              CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');
            END IF;
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Tier') THEN
              CREATE TYPE "Tier" AS ENUM ('FREE', 'STARTER', 'PRO');
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS "Scan" (
            "id" TEXT NOT NULL,
            "url" TEXT NOT NULL,
            "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
            "tier" "Tier" NOT NULL DEFAULT 'FREE',
            "email" TEXT NOT NULL,
            "viewport" TEXT NOT NULL,
            "desktop_result" JSONB,
            "mobile_result" JSONB,
            "error" TEXT,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "completed_at" TIMESTAMP(3),
            CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
          );

          CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL,
            "clerk_id" TEXT NOT NULL,
            "email" TEXT NOT NULL,
            "tier" "Tier" NOT NULL DEFAULT 'FREE',
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "User_pkey" PRIMARY KEY ("id")
          );

          CREATE INDEX IF NOT EXISTS "Scan_email_created_at_idx" ON "Scan"("email", "created_at");
          CREATE INDEX IF NOT EXISTS "Scan_status_idx" ON "Scan"("status");
          CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id");
          CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
        `);
        this.logger.log('Database tables created successfully.');
      } else {
        this.logger.log('Database tables already exist.');
      }
    } catch (err) {
      this.logger.warn(`Table check/creation failed: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected');
  }
}
