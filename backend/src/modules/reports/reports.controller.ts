import { Controller, Get, Post, Body, Param, Delete, Query, Res, NotFoundException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('reports')
@Roles('admin', 'audit_manager', 'auditor', 'executive')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard-stats')
  async getDashboardStats(): Promise<ApiResponse> {
    const data = await this.reportsService.getDashboardStats();
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

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

  @Get(':id/download/:format')
  async downloadReport(
    @Param('id') id: string,
    @Param('format') format: 'excel' | 'pdf',
    @Res() res: any,
  ) {
    try {
      const downloadInfo = await this.reportsService.getDownloadUrl(id, format);

      const contentType =
        format === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf';

      const safeFileName = encodeURIComponent(downloadInfo.fileName);
      res.setHeader('Content-Type', contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${safeFileName}`,
      );

      const fileStream = createReadStream(downloadInfo.filePath);
      fileStream.pipe(res);
    } catch (error) {
      if (error instanceof NotFoundException) {
        res.status(404).json({
          code: 404,
          message: error.message,
          data: null,
          timestamp: Date.now(),
        });
      } else {
        throw error;
      }
    }
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
