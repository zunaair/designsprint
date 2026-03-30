import { Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

/**
 * Global exception filter that reports unhandled errors to Sentry.
 * Only activates when SENTRY_DSN environment variable is configured.
 */
@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryExceptionFilter.name);

  override catch(exception: unknown, host: ArgumentsHost): void {
    const sentryDsn = process.env['SENTRY_DSN'];

    if (sentryDsn) {
      // Dynamic import to avoid loading Sentry when DSN is not set
      import('@sentry/node').then((Sentry) => {
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();

        // Add context for better debugging
        Sentry.withScope((scope) => {
          scope.setTag('url', request.url);
          scope.setTag('method', request.method);
          if (request.body?.url) scope.setExtra('scannedUrl', request.body.url);
          if (request.body?.email) scope.setExtra('email', request.body.email);

          // Only report non-HTTP exceptions (real bugs, not 404s/400s)
          if (!(exception instanceof HttpException) || (exception as HttpException).getStatus() >= 500) {
            Sentry.captureException(exception);
          }
        });
      }).catch(() => {
        // Sentry import failed — silently ignore
      });
    }

    // Always log the error
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      if (status >= 500) {
        this.logger.error(`[${status}] ${exception.message}`, exception.stack);
      }
    } else {
      this.logger.error(`Unhandled exception: ${exception}`, exception instanceof Error ? exception.stack : undefined);
    }

    super.catch(exception, host);
  }
}
