import { Controller, Get } from '@nestjs/common';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'DesignSprint™ API',
      version: '0.3.0',
      endpoints: {
        'POST /api/scans': 'Submit a URL for Arabic UX audit',
        'GET /api/scans/:id': 'Poll scan status and results (tier-filtered)',
        'GET /api/scans': 'List authenticated user scan history',
        'GET /api/user/me': 'Get authenticated user profile',
        'POST /api/billing/checkout': 'Create Paddle checkout session',
        'POST /api/billing/webhook': 'Paddle webhook endpoint',
        'GET /api/reports/:scanId/pdf': 'Download branded PDF report (paid tier)',
        'GET /api/fixpacks/:scanId': 'Get Fix Pack with CSS/HTML patches (paid tier)',
      },
    };
  }
}
