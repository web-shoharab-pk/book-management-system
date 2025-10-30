import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  getServerHealth(): {
    status: string;
    message: string;
    timestamp: string;
    version: string;
    uptime: number;
  } {
    // return server health details
    return {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime() || 0,
    };
  }
}
