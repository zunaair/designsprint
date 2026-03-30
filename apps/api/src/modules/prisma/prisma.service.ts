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

        // Create enums (each statement must be separate for Prisma raw queries)
        await this.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScanStatus') THEN CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED'); END IF; END $$`);
        await this.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Tier') THEN CREATE TYPE "Tier" AS ENUM ('FREE', 'STARTER', 'PRO'); END IF; END $$`);
        await this.$executeRawUnsafe(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ScanType') THEN CREATE TYPE "ScanType" AS ENUM ('SINGLE_PAGE', 'FULL_SITE', 'COMPARISON'); END IF; END $$`);

        // Create Scan table (with Sprint 6 columns)
        await this.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Scan" ("id" TEXT NOT NULL, "url" TEXT NOT NULL, "status" "ScanStatus" NOT NULL DEFAULT 'PENDING', "tier" "Tier" NOT NULL DEFAULT 'FREE', "scan_type" "ScanType" NOT NULL DEFAULT 'SINGLE_PAGE', "email" TEXT NOT NULL, "viewport" TEXT NOT NULL, "desktop_result" JSONB, "mobile_result" JSONB, "page_count" INTEGER NOT NULL DEFAULT 1, "page_results" JSONB, "error" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMP(3), "user_id" TEXT, "comparison_id" TEXT, CONSTRAINT "Scan_pkey" PRIMARY KEY ("id"))`);

        // Create User table (with Sprint 2 columns)
        await this.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" ("id" TEXT NOT NULL, "clerk_id" TEXT NOT NULL, "email" TEXT NOT NULL, "tier" "Tier" NOT NULL DEFAULT 'FREE', "paddle_customer_id" TEXT, "paddle_subscription_id" TEXT, "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"))`);

        // Create Comparison table (Sprint 6)
        await this.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Comparison" ("id" TEXT NOT NULL, "primary_url" TEXT NOT NULL, "competitor_urls" TEXT[] NOT NULL DEFAULT '{}', "status" "ScanStatus" NOT NULL DEFAULT 'PENDING', "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completed_at" TIMESTAMP(3), "user_id" TEXT NOT NULL, CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id"))`);

        // Create indexes
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Scan_email_created_at_idx" ON "Scan"("email", "created_at")`);
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Scan_status_idx" ON "Scan"("status")`);
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Scan_user_id_idx" ON "Scan"("user_id")`);
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Scan_comparison_id_idx" ON "Scan"("comparison_id")`);
        await this.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_clerk_id_key" ON "User"("clerk_id")`);
        await this.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
        await this.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_paddle_customer_id_key" ON "User"("paddle_customer_id")`);
        await this.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_paddle_subscription_id_key" ON "User"("paddle_subscription_id")`);
        await this.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Comparison_user_id_idx" ON "Comparison"("user_id")`);

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
