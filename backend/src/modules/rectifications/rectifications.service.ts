import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateRectificationDto } from './dto/create-rectification.dto';
import { UpdateRectificationDto } from './dto/update-rectification.dto';
import { AddUpdateDto } from './dto/add-update.dto';
import { VerifyCompletionDto } from './dto/verify-completion.dto';
import dayjs from 'dayjs';

@Injectable()
export class RectificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createRectificationDto: CreateRectificationDto, userId?: string) {
    const { findingId, measures, expectedCompletionDate, ...rest } = createRectificationDto;

    const finding = await this.prisma.finding.findUnique({
      where: { id: findingId },
      select: { id: true, auditObjectId: true, status: true, rectificationDeadline: true },
    });

    if (!finding) {
      throw new NotFoundException('审计发现不存在');
    }

    if (finding.status !== 'confirmed') {
      throw new BadRequestException('审计发现未确认，无法创建整改计划');
    }

    const existing = await this.prisma.rectification.findUnique({
      where: { findingId },
    });

    if (existing) {
      throw new BadRequestException('该审计发现已有整改计划');
    }

    const expectedDate = dayjs(expectedCompletionDate).toDate();
    const deadline = finding.rectificationDeadline;
    
    const isOverdue = deadline ? expectedDate > deadline : false;

    const rectification = await this.prisma.rectification.create({
      data: {
        ...rest,
        findingId,
        auditObjectId: finding.auditObjectId,
        measures: JSON.stringify(measures),
        expectedCompletionDate: expectedDate,
        status: 'submitted',
        isOverdue,
      },
      include: {
        finding: { select: { id: true, title: true, riskLevel: true } },
        auditObject: { select: { id: true, name: true } },
        responsiblePerson: { select: { id: true, name: true } },
      },
    });

    await this.prisma.finding.update({
      where: { id: findingId },
      data: { status: 'rectifying' },
    });

    return {
      ...rectification,
      measures,
    };
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    findingId?: string;
    auditObjectId?: string;
    status?: string;
    responsiblePersonId?: string;
    isOverdue?: boolean;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.findingId) where.findingId = query.findingId;
    if (query.auditObjectId) where.auditObjectId = query.auditObjectId;
    if (query.status) where.status = query.status;
    if (query.responsiblePersonId) where.responsiblePersonId = query.responsiblePersonId;
    if (query.isOverdue !== undefined) where.isOverdue = query.isOverdue;

    const [items, total] = await Promise.all([
      this.prisma.rectification.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          finding: { select: { id: true, title: true, riskLevel: true } },
          auditObject: { select: { id: true, name: true } },
          responsiblePerson: { select: { id: true, name: true } },
          rectificationUpdates: {
            orderBy: { updatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.rectification.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      measures: JSON.parse(item.measures as string) || [],
      rectificationUpdates: item.rectificationUpdates.map((update) => ({
        ...update,
        attachments: JSON.parse(update.attachments as string) || [],
      })),
    }));

    return {
      items: parsedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const rectification = await this.prisma.rectification.findUnique({
      where: { id },
      include: {
        finding: true,
        auditObject: true,
        responsiblePerson: { select: { id: true, name: true, email: true } },
        rectificationUpdates: {
          include: {
            updatedByUser: { select: { id: true, name: true } },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!rectification) {
      throw new NotFoundException('整改计划不存在');
    }

    return {
      ...rectification,
      measures: JSON.parse(rectification.measures as string) || [],
      rectificationUpdates: rectification.rectificationUpdates.map((update) => ({
        ...update,
        attachments: JSON.parse(update.attachments as string) || [],
      })),
    };
  }

  async update(id: string, updateRectificationDto: UpdateRectificationDto) {
    const rectification = await this.prisma.rectification.findUnique({ where: { id } });
    if (!rectification) {
      throw new NotFoundException('整改计划不存在');
    }

    const updateData: any = { ...updateRectificationDto };
    delete updateData.measures;

    if (updateRectificationDto.measures) {
      updateData.measures = JSON.stringify(updateRectificationDto.measures);
    }

    if (updateRectificationDto.expectedCompletionDate) {
      updateData.expectedCompletionDate = dayjs(updateRectificationDto.expectedCompletionDate).toDate();
    }

    const updated = await this.prisma.rectification.update({
      where: { id },
      data: updateData,
      include: {
        finding: { select: { id: true, title: true } },
        responsiblePerson: { select: { id: true, name: true } },
      },
    });

    return {
      ...updated,
      measures: JSON.parse(updated.measures as string) || [],
    };
  }

  async addUpdate(id: string, addUpdateDto: AddUpdateDto, userId?: string) {
    const rectification = await this.prisma.rectification.findUnique({ where: { id } });
    if (!rectification) {
      throw new NotFoundException('整改计划不存在');
    }

    const attachments = addUpdateDto.attachments || [];
    const update = await this.prisma.rectificationUpdate.create({
      data: {
        rectificationId: id,
        progress: addUpdateDto.progress,
        description: addUpdateDto.description,
        updatedBy: userId,
        attachments: JSON.stringify(attachments),
      },
      include: {
        updatedByUser: { select: { id: true, name: true } },
      },
    });

    let status = rectification.status;
    if (addUpdateDto.progress >= 100) {
      status = 'completed';
    } else if (addUpdateDto.progress > 0) {
      status = 'in_progress';
    }

    await this.prisma.rectification.update({
      where: { id },
      data: {
        progress: addUpdateDto.progress,
        status,
        ...(addUpdateDto.progress >= 100 ? { actualCompletionDate: dayjs().toDate() } : {}),
      },
    });

    return {
      ...update,
      attachments,
    };
  }

  async verifyCompletion(id: string, verifyCompletionDto: VerifyCompletionDto) {
    const rectification = await this.prisma.rectification.findUnique({ where: { id } });
    if (!rectification) {
      throw new NotFoundException('整改计划不存在');
    }

    if (rectification.status !== 'completed') {
      throw new BadRequestException('整改未完成，无法验证');
    }

    const newStatus = verifyCompletionDto.passed ? 'completed' : 'in_progress';

    return this.prisma.rectification.update({
      where: { id },
      data: {
        status: newStatus,
        ...(verifyCompletionDto.passed ? {} : { progress: Math.max(0, rectification.progress - 20) }),
      },
      include: {
        finding: { select: { id: true, title: true } },
        responsiblePerson: { select: { id: true, name: true } },
      },
    });
  }

  async checkOverdue() {
    const today = dayjs().startOf('day').toDate();
    
    const overdueItems = await this.prisma.rectification.findMany({
      where: {
        expectedCompletionDate: { lt: today },
        status: { notIn: ['completed', 'overdue'] },
        isOverdue: false,
      },
    });

    for (const item of overdueItems) {
      await this.prisma.rectification.update({
        where: { id: item.id },
        data: {
          status: 'overdue',
          isOverdue: true,
          escalationLevel: { increment: 1 },
        },
      });
    }

    return {
      updated: overdueItems.length,
      items: overdueItems.map((item) => ({
        id: item.id,
        findingId: item.findingId,
        escalationLevel: item.escalationLevel + 1,
      })),
    };
  }
}
