import { Controller, Get, Post, Body, Param, Delete, Query, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { GetUser } from '../../common/decorators/get-user.decorator';

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('notifications')
@Roles('admin', 'audit_manager', 'auditor', 'department_head')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @Roles('admin', 'audit_manager')
  async create(
    @Body() createNotificationDto: CreateNotificationDto,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.create(createNotificationDto, user?.id);
    return {
      code: 0,
      message: '通知发送成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get()
  async findAll(
    @GetUser() user: any,
    @Query() query: {
      page?: number;
      pageSize?: number;
      isRead?: boolean;
      type?: string;
      priority?: string;
    },
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.findAll(user?.id, query);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.findOne(id, user?.id);
    return {
      code: 0,
      message: '查询成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.markAsRead(id, user?.id);
    return {
      code: 0,
      message: '标记已读成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('read-all')
  async markAllAsRead(@GetUser() user: any): Promise<ApiResponse> {
    const data = await this.notificationsService.markAllAsRead(user?.id);
    return {
      code: 0,
      message: '全部标记已读成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Delete(':id')
  async delete(
    @Param('id') id: string,
    @GetUser() user: any,
  ): Promise<ApiResponse> {
    const data = await this.notificationsService.delete(id, user?.id);
    return {
      code: 0,
      message: '删除成功',
      data,
      timestamp: Date.now(),
    };
  }
}
