import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditPlansService } from './audit-plans.service';
import { CreateAuditPlanDto } from './dto/create-audit-plan.dto';
import { UpdateAuditPlanDto } from './dto/update-audit-plan.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ReassignDto } from './dto/reassign.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('audit-plans')
@Roles('admin', 'audit_manager', 'auditor')
export class AuditPlansController {
  constructor(private readonly auditPlansService: AuditPlansService) {}

  @Post('generate')
  @Roles('admin', 'audit_manager')
  async generatePlan(
    @Body() generatePlanDto: GeneratePlanDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.auditPlansService.generatePlan(generatePlanDto, user?.id);
    return {
      code: 0,
      message: '生成成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post()
  async create(@Body() createAuditPlanDto: CreateAuditPlanDto): Promise<ApiResponse> {
    const data = await this.auditPlansService.create(createAuditPlanDto);
    return {
      code: 0,
      message: '创建成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get()
  async findAll(
    @Query() query: {
      page?: number;
      pageSize?: number;
      year?: number;
      status?: string;
      auditObjectId?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.auditPlansService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.auditPlansService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateAuditPlanDto: UpdateAuditPlanDto,
  ): Promise<ApiResponse> {
    const data = await this.auditPlansService.update(id, updateAuditPlanDto);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/reassign')
  @Roles('admin', 'audit_manager')
  async reassign(
    @Param('id') id: string,
    @Body() reassignDto: ReassignDto,
  ): Promise<ApiResponse> {
    const data = await this.auditPlansService.reassign(id, reassignDto);
    return {
      code: 0,
      message: '重新分配成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'audit_manager')
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.auditPlansService.remove(id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
