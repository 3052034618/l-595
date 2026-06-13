import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(
    senderId: string | 'system',
    type: 'message' | 'alert' | 'system' | 'task',
    title: string,
    content: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    relatedType?: string,
    relatedId?: string,
    recipientId?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        id: uuidv4(),
        recipientId: recipientId || '',
        type,
        title,
        content,
        priority,
        relatedType,
        relatedId,
        isRead: false,
      },
      include: {
        recipient: { select: { id: true, name: true } },
      },
    });

    return notification;
  }

  async create(createNotificationDto: CreateNotificationDto, senderId?: string) {
    return this.createNotification(
      senderId || 'system',
      createNotificationDto.type,
      createNotificationDto.title,
      createNotificationDto.content,
      createNotificationDto.priority,
      createNotificationDto.relatedType,
      createNotificationDto.relatedId,
      createNotificationDto.recipientId,
    );
  }

  async findAll(userId: string, query: {
    page?: number;
    pageSize?: number;
    isRead?: boolean;
    type?: string;
    priority?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {
      recipientId: userId,
    };

    if (query.isRead !== undefined) where.isRead = query.isRead;
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          recipient: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    return {
      items,
      total,
      unreadCount,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id },
      include: {
        recipient: { select: { id: true, name: true } },
      },
    });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.recipientId && notification.recipientId !== userId) {
      throw new NotFoundException('通知不存在');
    }

    if (!notification.isRead) {
      await this.prisma.notification.update({
        where: { id },
        data: { isRead: true, readAt: new Date() },
      });
    }

    return notification;
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.recipientId && notification.recipientId !== userId) {
      throw new NotFoundException('通知不存在');
    }

    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });

    return { updated: result.count };
  }

  async sendEscalation(rectificationItem: any, escalationLevel: number) {
    const priorityMap: Record<number, 'low' | 'medium' | 'high'> = {
      1: 'medium',
      2: 'high',
      3: 'high',
    };

    const priority = priorityMap[escalationLevel] || 'medium';
    const levelText = escalationLevel === 1 ? '一级' : escalationLevel === 2 ? '二级' : '三级';

    return this.createNotification(
      'system',
      'alert',
      `整改超期${levelText}预警`,
      `整改计划已超期，请立即处理。整改ID: ${rectificationItem.id}`,
      priority,
      'rectification',
      rectificationItem.id,
    );
  }

  async delete(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    if (notification.recipientId && notification.recipientId !== userId) {
      throw new NotFoundException('通知不存在');
    }

    return this.prisma.notification.delete({ where: { id } });
  }
}
