import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { RectificationsService } from './rectifications.service';
import { CreateRectificationDto } from './dto/create-rectification.dto';
import { UpdateRectificationDto } from './dto/update-rectification.dto';
import { AddUpdateDto } from './dto/add-update.dto';
import { VerifyCompletionDto } from './dto/verify-completion.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('rectifications')
@Roles('admin', 'audit_manager', 'auditor', 'department_head')
export class RectificationsController {
  constructor(private readonly rectificationsService: RectificationsService) {}

  @Post()
  @Roles('admin', 'audit_manager', 'department_head')
  async create(
    @Body() createRectificationDto: CreateRectificationDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.rectificationsService.create(createRectificationDto, user?.id);
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
      findingId?: string;
      auditObjectId?: string;
      status?: string;
      responsiblePersonId?: string;
      isOverdue?: boolean;
    },
  ): Promise<ApiResponse> {
    const data = await this.rectificationsService.findAll(query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse> {
    const data = await this.rectificationsService.findOne(id);
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
    @Body() updateRectificationDto: UpdateRectificationDto,
  ): Promise<ApiResponse> {
    const data = await this.rectificationsService.update(id, updateRectificationDto);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/update')
  @Roles('admin', 'audit_manager', 'auditor', 'department_head')
  async addUpdate(
    @Param('id') id: string,
    @Body() addUpdateDto: AddUpdateDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.rectificationsService.addUpdate(id, addUpdateDto, user?.id);
    return {
      code: 0,
      message: '更新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/verify')
  @Roles('admin', 'audit_manager')
  async verifyCompletion(
    @Param('id') id: string,
    @Body() verifyCompletionDto: VerifyCompletionDto,
  ): Promise<ApiResponse> {
    const data = await this.rectificationsService.verifyCompletion(id, verifyCompletionDto);
    return {
      code: 0,
      message: verifyCompletionDto.passed ? '验证通过' : '验证不通过，请继续整改',
      data,
      timestamp: Date.now(),
    };
  }
}
