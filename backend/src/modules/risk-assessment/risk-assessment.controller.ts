import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RiskAssessmentService } from './risk-assessment.service';
import { TriggerAssessmentDto } from './dto/trigger-assessment.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('risk-assessment')
@Roles('admin', 'audit_manager')
export class RiskAssessmentController {
  constructor(private readonly riskAssessmentService: RiskAssessmentService) {}

  @Get('model')
  async getRiskModel(): Promise<ApiResponse> {
    const data = await this.riskAssessmentService.getRiskModel();
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('model')
  async updateRiskModel(@Body() body: { dimensions: any[] }): Promise<ApiResponse> {
    const data = await this.riskAssessmentService.updateRiskModel(body.dimensions);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('trigger')
  async triggerAssessment(
    @Body() triggerDto: TriggerAssessmentDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.riskAssessmentService.triggerAssessment(triggerDto, user?.id);
    return {
      code: 0,
      message: '评估完成',
      data,
      timestamp: Date.now(),
    };
  }

  @Get('history/:auditObjectId')
  async getHistory(
    @Param('auditObjectId') auditObjectId: string,
    @Query() query: { page?: number; pageSize?: number; startDate?: string; endDate?: string },
  ): Promise<ApiResponse> {
    const data = await this.riskAssessmentService.getHistory(auditObjectId, query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }
}
