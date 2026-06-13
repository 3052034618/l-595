import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { FindingsService } from './findings.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { ConfirmFindingDto } from './dto/confirm-finding.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('findings')
@Roles('admin', 'audit_manager', 'auditor', 'department_head')
export class FindingsController {
  constructor(private readonly findingsService: FindingsService) {}

  @Post()
  @Roles('admin', 'audit_manager', 'auditor')
  async create(
    @Body() createFindingDto: CreateFindingDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.findingsService.create(createFindingDto, user?.id);
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
      auditPlanId?: string;
      auditObjectId?: string;
      riskLevel?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.findingsService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.findingsService.findOne(id);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Patch(':id')
  @Roles('admin', 'audit_manager', 'auditor')
  async update(
    @Param('id') id: string,
    @Body() updateFindingDto: UpdateFindingDto,
  ): Promise<ApiResponse> {
    const data = await this.findingsService.update(id, updateFindingDto);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/confirm')
  @Roles('admin', 'audit_manager', 'department_head')
  async confirm(
    @Param('id') id: string,
    @Body() confirmFindingDto: ConfirmFindingDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.findingsService.confirm(id, confirmFindingDto, user?.id);
    return {
      code: 0,
      message: confirmFindingDto.confirmed ? '确认成功' : '已拒绝',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles('admin', 'audit_manager')
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.findingsService.remove(id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
