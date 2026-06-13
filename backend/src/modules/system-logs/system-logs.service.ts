import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SystemLogsService {
  constructor(private prisma: PrismaService) {}

  async createLog(
    userId: string | null,
    operation: string,
    module: string,
    level: 'info' | 'warn' | 'error' | 'debug' = 'info',
    details?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.systemLog.create({
      data: {
        id: uuidv4(),
        userId,
        operation,
        module,
        ipAddress,
        userAgent,
        requestData: details?.requestData ? JSON.stringify(details.requestData) : null,
        responseData: details?.responseData ? JSON.stringify(details.responseData) : null,
        responseCode: details?.responseCode,
        durationMs: details?.durationMs,
      },
    });
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    userId?: string;
    module?: string;
    operation?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 20;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.module) where.module = query.module;
    if (query.operation) where.operation = { contains: query.operation };
    if (query.startDate) where.createdAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.createdAt = { ...where.createdAt, lte: dayjs(query.endDate).toDate() };

    const [items, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          user: { select: { id: true, name: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      requestData: item.requestData ? JSON.parse(item.requestData as string) : null,
      responseData: item.responseData ? JSON.parse(item.responseData as string) : null,
    }));

    return {
      items: parsedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStats(query: { startDate?: string; endDate?: string }) {
    const where: any = {};
    if (query.startDate) where.createdAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.createdAt = { ...where.createdAt, lte: dayjs(query.endDate).toDate() };

    const [total, byModule] = await Promise.all([
      this.prisma.systemLog.count({ where }),
      this.prisma.systemLog.groupBy({
        by: ['module'],
        where,
        _count: true,
        orderBy: { _count: { module: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byModule: byModule.map((item: any) => ({ module: item.module, count: item._count })),
    };
  }

  async cleanOldLogs(daysToKeep: number = 90) {
    const cutoffDate = dayjs().subtract(daysToKeep, 'day').toDate();

    const result = await this.prisma.systemLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return { deleted: result.count };
  }
}
