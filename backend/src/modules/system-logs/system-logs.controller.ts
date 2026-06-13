import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { Roles } from '../../common/decorators/roles.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('system-logs')
@Roles('admin')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  async findAll(
    @Query() query: {
      page?: number;
      pageSize?: number;
      userId?: string;
      module?: string;
      level?: string;
      action?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.systemLogsService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get('stats')
  async getStats(
    @Query() query: { startDate?: string; endDate?: string },
  ): Promise<ApiResponse> {
    const data = await this.systemLogsService.getStats(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('clean')
  async cleanOldLogs(
    @Body() body: { daysToKeep?: number },
  ): Promise<ApiResponse> {
    const data = await this.systemLogsService.cleanOldLogs(body.daysToKeep || 90);
    return {
      code: 0,
      message: '清理成功',
      data,
      timestamp: Date.now(),
    };
  }
}
