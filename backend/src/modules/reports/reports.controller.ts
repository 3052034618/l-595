import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('reports')
@Roles('admin', 'audit_manager')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('generate')
  async generateReport(
    @Body() generateReportDto: GenerateReportDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.reportsService.generateReport(generateReportDto, user?.id);
    return {
      code: 0,
      message: '报告生成成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get()
  async findAll(
    @Query() query: {
      page?: number;
      pageSize?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.reportsService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.reportsService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/export')
  async exportReport(
    @Param('id') id: string,
    @Body() body: { format?: 'pdf' | 'excel' },
  ): Promise<ApiResponse> {
    const data = await this.reportsService.exportReport(id, body.format || 'pdf');
    return {
      code: 0,
      message: '报告导出成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.reportsService.delete(id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
