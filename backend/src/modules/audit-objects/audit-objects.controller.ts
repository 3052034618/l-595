import { Controller, Get, Post, Body, Patch, Param, Delete, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuditObjectsService } from './audit-objects.service';
import { CreateAuditObjectDto } from './dto/create-audit-object.dto';
import { UpdateAuditObjectDto } from './dto/update-audit-object.dto';
import { Roles } from '../../common/decorators/roles.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('audit-objects')
@Roles('admin', 'audit_manager', 'auditor')
export class AuditObjectsController {
  constructor(private readonly auditObjectsService: AuditObjectsService) {}

  @Post()
  async create(@Body() createAuditObjectDto: CreateAuditObjectDto): Promise<ApiResponse> {
    const data = await this.auditObjectsService.create(createAuditObjectDto);
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
      keyword?: string;
      riskLevel?: string;
      industry?: string;
      status?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.auditObjectsService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.auditObjectsService.findOne(id);
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
    @Body() updateAuditObjectDto: UpdateAuditObjectDto,
  ): Promise<ApiResponse> {
    const data = await this.auditObjectsService.update(id, updateAuditObjectDto);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.auditObjectsService.remove(id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
