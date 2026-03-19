import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'DesignSprint™ API',
      version: '0.0.1',
      endpoints: {
        'POST /api/scans': 'Submit a URL for Arabic UX audit',
        'GET /api/scans/:id': 'Poll scan status and results',
      },
    };
  }
}
