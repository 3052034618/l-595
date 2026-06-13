import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAuditObjectDto } from './dto/create-audit-object.dto';
import { UpdateAuditObjectDto } from './dto/update-audit-object.dto';

@Injectable()
export class AuditObjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createAuditObjectDto: CreateAuditObjectDto) {
    const existing = await this.prisma.auditObject.findUnique({
      where: { code: createAuditObjectDto.code },
    });

    if (existing) {
      throw new BadRequestException('编码已存在');
    }

    return this.prisma.auditObject.create({
      data: createAuditObjectDto,
    });
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    riskLevel?: string;
    industry?: string;
    status?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { code: { contains: query.keyword } },
      ];
    }
    if (query.riskLevel) where.riskLevel = query.riskLevel;
    if (query.industry) where.industry = query.industry;
    if (query.status) where.status = query.status;

    const [items, total] = await Promise.all([
      this.prisma.auditObject.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditObject.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const auditObject = await this.prisma.auditObject.findUnique({
      where: { id },
      include: {
        riskAssessments: {
          take: 10,
          orderBy: { assessedAt: 'desc' },
          include: { riskFactors: true },
        },
        auditPlans: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        findings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!auditObject) {
      throw new NotFoundException('审计对象不存在');
    }

    return auditObject;
  }

  async update(id: string, updateAuditObjectDto: UpdateAuditObjectDto) {
    const auditObject = await this.prisma.auditObject.findUnique({ where: { id } });
    if (!auditObject) {
      throw new NotFoundException('审计对象不存在');
    }

    if (updateAuditObjectDto.code && updateAuditObjectDto.code !== auditObject.code) {
      const existing = await this.prisma.auditObject.findUnique({
        where: { code: updateAuditObjectDto.code },
      });
      if (existing) {
        throw new BadRequestException('编码已存在');
      }
    }

    return this.prisma.auditObject.update({
      where: { id },
      data: updateAuditObjectDto,
    });
  }

  async remove(id: string) {
    const auditObject = await this.prisma.auditObject.findUnique({ where: { id } });
    if (!auditObject) {
      throw new NotFoundException('审计对象不存在');
    }

    await this.prisma.auditObject.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
