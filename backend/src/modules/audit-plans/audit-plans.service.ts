import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateAuditPlanDto } from './dto/create-audit-plan.dto';
import { UpdateAuditPlanDto } from './dto/update-audit-plan.dto';
import { GeneratePlanDto } from './dto/generate-plan.dto';
import { ReassignDto } from './dto/reassign.dto';
import dayjs from 'dayjs';

@Injectable()
export class AuditPlansService {
  constructor(private prisma: PrismaService) {}

  async generatePlan(generatePlanDto: GeneratePlanDto, userId?: string) {
    const { year, autoAssign } = generatePlanDto;

    const highRiskObjects = await this.prisma.auditObject.findMany({
      where: {
        status: 'active',
        riskLevel: 'high',
      },
      orderBy: { riskScore: 'desc' },
    });

    const mediumRiskObjects = await this.prisma.auditObject.findMany({
      where: {
        status: 'active',
        riskLevel: 'medium',
      },
      orderBy: { riskScore: 'desc' },
      take: 10,
    });

    const allObjects = [...highRiskObjects, ...mediumRiskObjects];
    const auditors = await this.prisma.user.findMany({
      where: { role: 'auditor', isActive: true },
    });

    const plans = [];
    let auditorIndex = 0;

    for (let i = 0; i < allObjects.length; i++) {
      const obj = allObjects[i];
      const startMonth = Math.floor(i * 12 / allObjects.length) + 1;
      const startDate = dayjs(`${year}-${String(startMonth).padStart(2, '0')}-01`);
      const endDate = startDate.add(1, 'month').subtract(1, 'day');

      const leadAuditor = autoAssign && auditors.length > 0
        ? auditors[auditorIndex % auditors.length]
        : null;

      const plan = await this.prisma.auditPlan.create({
        data: {
          year,
          name: `${year}年度-${obj.name}-${i + 1}`,
          description: `基于风险评估自动生成的${obj.name}审计计划`,
          status: 'draft',
          startDate: startDate.toDate(),
          endDate: endDate.toDate(),
          auditObjectId: obj.id,
          leadAuditorId: leadAuditor?.id,
          planAuditors: autoAssign && auditors.length > 0
            ? {
                create: [
                  {
                    auditorId: leadAuditor!.id,
                    role: 'lead',
                  },
                  {
                    auditorId: auditors[(auditorIndex + 1) % auditors.length].id,
                    role: 'auditor',
                  },
                ],
              }
            : undefined,
        },
      });

      plans.push(plan);
      auditorIndex += 2;
    }

    return {
      generated: plans.length,
      plans,
    };
  }

  async create(createAuditPlanDto: CreateAuditPlanDto) {
    const { auditorIds, leadAuditorId, ...rest } = createAuditPlanDto;

    return this.prisma.auditPlan.create({
      data: {
        ...rest,
        startDate: dayjs(rest.startDate).toDate(),
        endDate: dayjs(rest.endDate).toDate(),
        planAuditors: {
          create: [
            { auditorId: leadAuditorId, role: 'lead' },
            ...auditorIds.filter((id) => id !== leadAuditorId).map((id) => ({
              auditorId: id,
              role: 'auditor',
            })),
          ],
        },
      },
      include: {
        auditObject: true,
        leadAuditor: { select: { id: true, name: true } },
        planAuditors: {
          include: { auditor: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    year?: number;
    status?: string;
    auditObjectId?: string;
    keyword?: string;
  }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.year) where.year = query.year;
    if (query.status) where.status = query.status;
    if (query.auditObjectId) where.auditObjectId = query.auditObjectId;
    if (query.keyword) {
      where.OR = [
        { name: { contains: query.keyword } },
        { description: { contains: query.keyword } },
        {
          auditObject: {
            name: { contains: query.keyword },
          },
        },
        {
          leadAuditor: {
            name: { contains: query.keyword },
          },
        },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.auditPlan.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          auditObject: { select: { id: true, name: true, riskLevel: true } },
          leadAuditor: { select: { id: true, name: true } },
          planAuditors: {
            include: { auditor: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditPlan.count({ where }),
    ]);

    return {
      items: items.map((plan) => ({
        ...plan,
        auditorNames: plan.planAuditors.map((pa) => pa.auditor.name),
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const plan = await this.prisma.auditPlan.findUnique({
      where: { id },
      include: {
        auditObject: true,
        leadAuditor: { select: { id: true, name: true, email: true } },
        planAuditors: {
          include: { auditor: { select: { id: true, name: true, email: true } } },
        },
        findings: true,
        evidences: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('审计计划不存在');
    }

    return {
      ...plan,
      auditorNames: plan.planAuditors.map((pa) => pa.auditor.name),
    };
  }

  async update(id: string, updateAuditPlanDto: UpdateAuditPlanDto) {
    const plan = await this.prisma.auditPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('审计计划不存在');
    }

    const { auditorIds, leadAuditorId, ...rest } = updateAuditPlanDto;
    const updateData: any = { ...rest };

    if (rest.startDate) updateData.startDate = dayjs(rest.startDate).toDate();
    if (rest.endDate) updateData.endDate = dayjs(rest.endDate).toDate();

    if (auditorIds || leadAuditorId) {
      updateData.planAuditors = {
        deleteMany: {},
        create: [
          ...(leadAuditorId ? [{ auditorId: leadAuditorId, role: 'lead' }] : []),
          ...(auditorIds
            ? auditorIds
                .filter((aid) => aid !== leadAuditorId)
                .map((aid) => ({ auditorId: aid, role: 'auditor' }))
            : []),
        ],
      };
    }

    return this.prisma.auditPlan.update({
      where: { id },
      data: updateData,
      include: {
        auditObject: true,
        leadAuditor: { select: { id: true, name: true } },
        planAuditors: {
          include: { auditor: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async reassign(id: string, reassignDto: ReassignDto) {
    const plan = await this.prisma.auditPlan.findUnique({
      where: { id },
      include: { auditObject: true },
    });
    if (!plan) {
      throw new NotFoundException('审计计划不存在');
    }

    const updateData: any = {};
    let originalLeadAuditorId = plan.leadAuditorId;

    if (reassignDto.leadAuditorId) {
      updateData.leadAuditorId = reassignDto.leadAuditorId;
    }

    let existingAuditors: any[] = [];
    if (reassignDto.auditorIds || reassignDto.leadAuditorId) {
      existingAuditors = await this.prisma.planAuditor.findMany({
        where: { auditPlanId: id },
      });

      updateData.planAuditors = {
        deleteMany: {},
        create: [
          ...(reassignDto.leadAuditorId
            ? [{ auditorId: reassignDto.leadAuditorId, role: 'lead' }]
            : existingAuditors.filter((pa) => pa.role === 'lead').map((pa) => ({
                auditorId: pa.auditorId,
                role: 'lead',
              }))),
          ...(reassignDto.auditorIds
            ? reassignDto.auditorIds
                .filter((aid) => aid !== reassignDto.leadAuditorId)
                .map((aid) => ({ auditorId: aid, role: 'auditor' }))
            : existingAuditors
                .filter((pa) => pa.role === 'auditor')
                .map((pa) => ({ auditorId: pa.auditorId, role: 'auditor' }))),
        ],
      };
    }

    const originalAuditorIds = existingAuditors.map((pa) => pa.auditorId);
    const newLeadAuditorId = reassignDto.leadAuditorId || originalLeadAuditorId;
    const newAuditorIds = reassignDto.auditorIds
      ? [...new Set([...(newLeadAuditorId ? [newLeadAuditorId] : []), ...reassignDto.auditorIds])]
      : originalAuditorIds;

    const addedAuditorIds = newAuditorIds.filter((id) => !originalAuditorIds.includes(id));
    const removedAuditorIds = originalAuditorIds.filter((id) => !newAuditorIds.includes(id));
    const leadAuditorChanged = originalLeadAuditorId !== newLeadAuditorId;

    const result = await this.prisma.auditPlan.update({
      where: { id },
      data: updateData,
      include: {
        leadAuditor: { select: { id: true, name: true } },
        planAuditors: {
          include: { auditor: { select: { id: true, name: true } } },
        },
      },
    });

    const notifications: any[] = [];
    const planName = plan.name;

    for (const auditorId of addedAuditorIds) {
      if (auditorId === newLeadAuditorId && leadAuditorChanged) {
        notifications.push({
          recipientId: auditorId,
          type: 'audit_change',
          title: '审计计划变更通知',
          content: `您被任命为审计计划「${planName}」的主审计师，请及时处理。`,
          priority: 'medium',
          relatedType: 'audit_plan',
          relatedId: id,
          isRead: false,
        });
      } else {
        notifications.push({
          recipientId: auditorId,
          type: 'audit_change',
          title: '审计计划变更通知',
          content: `您被分配到审计计划「${planName}」，请及时处理。`,
          priority: 'medium',
          relatedType: 'audit_plan',
          relatedId: id,
          isRead: false,
        });
      }
    }

    for (const auditorId of removedAuditorIds) {
      if (auditorId === originalLeadAuditorId) {
        notifications.push({
          recipientId: auditorId,
          type: 'audit_change',
          title: '审计计划变更通知',
          content: `您已不再担任审计计划「${planName}」的主审计师。`,
          priority: 'medium',
          relatedType: 'audit_plan',
          relatedId: id,
          isRead: false,
        });
      } else {
        notifications.push({
          recipientId: auditorId,
          type: 'audit_change',
          title: '审计计划变更通知',
          content: `您已从审计计划「${planName}」中移除。`,
          priority: 'medium',
          relatedType: 'audit_plan',
          relatedId: id,
          isRead: false,
        });
      }
    }

    if (leadAuditorChanged && newLeadAuditorId && !addedAuditorIds.includes(newLeadAuditorId)) {
      notifications.push({
        recipientId: newLeadAuditorId,
        type: 'audit_change',
        title: '审计计划变更通知',
        content: `您被任命为审计计划「${planName}」的主审计师，请及时处理。`,
        priority: 'medium',
        relatedType: 'audit_plan',
        relatedId: id,
        isRead: false,
      });
    }

    if (plan.auditObject?.contactPerson) {
      const contactUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            { name: plan.auditObject.contactPerson },
            { email: plan.auditObject.contactPerson },
          ],
        },
        select: { id: true },
      });
      if (contactUser) {
        notifications.push({
          recipientId: contactUser.id,
          type: 'audit_change',
          title: '审计计划变更通知',
          content: `与您相关的审计计划「${planName}」人员已调整，请注意配合。`,
          priority: 'medium',
          relatedType: 'audit_plan',
          relatedId: id,
          isRead: false,
        });
      }
    }

    const originalLeadAuditor = existingAuditors.find((pa) => pa.role === 'lead');

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
      });
    }

    return {
      plan: {
        ...result,
        auditorNames: result.planAuditors.map((pa) => pa.auditor.name),
      },
      originalLeadAuditor,
      addedAuditorIds,
      removedAuditorIds,
      leadAuditorChanged,
      notificationsCreated: notifications.length,
    };
  }

  async remove(id: string) {
    const plan = await this.prisma.auditPlan.findUnique({ where: { id } });
    if (!plan) {
      throw new NotFoundException('审计计划不存在');
    }

    await this.prisma.auditPlan.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
