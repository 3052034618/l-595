import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateFindingDto } from './dto/create-finding.dto';
import { UpdateFindingDto } from './dto/update-finding.dto';
import { ConfirmFindingDto } from './dto/confirm-finding.dto';
import dayjs from 'dayjs';

@Injectable()
export class FindingsService {
  constructor(private prisma: PrismaService) {}

  private classifyRisk(description: string, category?: string): { level: string; score: number } {
    let score = 50;
    
    const highRiskKeywords = ['重大', '严重', '违规', '违法', '贪污', '受贿', '挪用', '造假', '欺诈'];
    const mediumRiskKeywords = ['不规范', '漏洞', '缺陷', '问题', '风险', '异常'];
    
    for (const keyword of highRiskKeywords) {
      if (description.includes(keyword)) {
        score = Math.min(100, score + 30);
      }
    }
    
    for (const keyword of mediumRiskKeywords) {
      if (description.includes(keyword)) {
        score = Math.min(100, score + 15);
      }
    }
    
    if (category === '财务' || category === '合规') {
      score += 10;
    }
    
    let level = 'low';
    if (score >= 70) level = 'high';
    else if (score >= 40) level = 'medium';
    
    return { level, score: Math.round(score) };
  }

  async create(createFindingDto: CreateFindingDto, userId?: string) {
    const { evidenceIds, ...rest } = createFindingDto;
    
    let riskLevel = rest.riskLevel;
    let riskScore: number | undefined;
    
    if (!riskLevel) {
      const classification = this.classifyRisk(rest.description, rest.category);
      riskLevel = classification.level;
      riskScore = classification.score;
    }

    return this.prisma.finding.create({
      data: {
        ...rest,
        riskLevel,
        riskScore,
        rectificationDeadline: dayjs(rest.rectificationDeadline).toDate(),
        discoveredBy: userId,
        findingEvidences: evidenceIds
          ? {
              create: evidenceIds.map((evidenceId) => ({ evidenceId })),
            }
          : undefined,
      },
      include: {
        auditObject: { select: { id: true, name: true } },
        auditPlan: { select: { id: true, name: true } },
        discoveredByUser: { select: { id: true, name: true } },
        findingEvidences: {
          include: { evidence: { select: { id: true, originalName: true, fileUrl: true } } },
        },
      },
    });
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    auditPlanId?: string;
    auditObjectId?: string;
    riskLevel?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.auditPlanId) where.auditPlanId = query.auditPlanId;
    if (query.auditObjectId) where.auditObjectId = query.auditObjectId;
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.status) where.status = query.status;
    if (query.startDate) where.discoveredAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.discoveredAt = { ...where.discoveredAt, lte: dayjs(query.endDate).toDate() };

    const [items, total] = await Promise.all([
      this.prisma.finding.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          auditObject: { select: { id: true, name: true } },
          auditPlan: { select: { id: true, name: true } },
          discoveredByUser: { select: { id: true, name: true } },
          findingEvidences: {
            include: { evidence: { select: { id: true, originalName: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.finding.count({ where }),
    ]);

    return {
      items: items.map((finding) => ({
        ...finding,
        evidenceIds: finding.findingEvidences.map((fe) => fe.evidenceId),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const finding = await this.prisma.finding.findUnique({
      where: { id },
      include: {
        auditObject: true,
        auditPlan: true,
        discoveredByUser: { select: { id: true, name: true } },
        confirmedByUser: { select: { id: true, name: true } },
        findingEvidences: {
          include: { evidence: true },
        },
        rectification: true,
      },
    });

    if (!finding) {
      throw new NotFoundException('审计发现不存在');
    }

    return {
      ...finding,
      evidenceIds: finding.findingEvidences.map((fe) => fe.evidenceId),
    };
  }

  async update(id: string, updateFindingDto: UpdateFindingDto) {
    const finding = await this.prisma.finding.findUnique({ where: { id } });
    if (!finding) {
      throw new NotFoundException('审计发现不存在');
    }

    const { evidenceIds, ...rest } = updateFindingDto;
    const updateData: any = { ...rest };

    if (rest.rectificationDeadline) {
      updateData.rectificationDeadline = dayjs(rest.rectificationDeadline).toDate();
    }

    if (evidenceIds) {
      updateData.findingEvidences = {
        deleteMany: {},
        create: evidenceIds.map((evidenceId) => ({ evidenceId })),
      };
    }

    return this.prisma.finding.update({
      where: { id },
      data: updateData,
      include: {
        auditObject: { select: { id: true, name: true } },
        auditPlan: { select: { id: true, name: true } },
        findingEvidences: {
          include: { evidence: { select: { id: true, originalName: true } } },
        },
      },
    });
  }

  async confirm(id: string, confirmFindingDto: ConfirmFindingDto, userId?: string) {
    const finding = await this.prisma.finding.findUnique({ where: { id } });
    if (!finding) {
      throw new NotFoundException('审计发现不存在');
    }

    if (finding.status !== 'pending_confirmation') {
      throw new BadRequestException('该发现已处理，无法重复确认');
    }

    const status = confirmFindingDto.confirmed ? 'confirmed' : 'pending_confirmation';

    return this.prisma.finding.update({
      where: { id },
      data: {
        status,
        confirmedBy: userId,
        confirmedAt: dayjs().toDate(),
        confirmComment: confirmFindingDto.comment,
      },
      include: {
        auditObject: { select: { id: true, name: true } },
        confirmedByUser: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: string) {
    const finding = await this.prisma.finding.findUnique({ where: { id } });
    if (!finding) {
      throw new NotFoundException('审计发现不存在');
    }

    await this.prisma.finding.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
