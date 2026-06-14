import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { TriggerAssessmentDto } from './dto/trigger-assessment.dto';
import dayjs from 'dayjs';

interface DimensionScores {
  financialRisk: number;
  operationalRisk: number;
  complianceRisk: number;
  strategicRisk: number;
  reputationalRisk: number;
}

@Injectable()
export class RiskAssessmentService {
  constructor(private prisma: PrismaService) {}

  async getRiskModel() {
    const models = await this.prisma.riskModel.findMany({
      where: { isActive: true },
      orderBy: { weight: 'desc' },
    });

    return {
      dimensions: models.map((m) => ({
        id: m.id,
        name: m.dimensionName,
        code: m.dimensionCode,
        weight: m.weight,
        factors: JSON.parse(m.factors as string) || [],
      })),
    };
  }

  async updateRiskModel(dimensions: any[]) {
    for (const dim of dimensions) {
      await this.prisma.riskModel.update({
        where: { dimensionCode: dim.code },
        data: {
          dimensionName: dim.name,
          weight: dim.weight,
          factors: JSON.stringify(dim.factors),
          isActive: true,
        },
      });
    }

    return this.getRiskModel();
  }

  async triggerAssessment(triggerDto: TriggerAssessmentDto, userId?: string) {
    const auditObjectIds = triggerDto.auditObjectIds?.length
      ? triggerDto.auditObjectIds
      : (await this.prisma.auditObject.findMany({ where: { status: 'active' }, select: { id: true } })).map((o) => o.id);

    const results = [];

    for (const auditObjectId of auditObjectIds) {
      const result = await this.calculateRisk(auditObjectId, triggerDto.isManual, userId);
      results.push(result);
    }

    return results;
  }

  private async calculateRisk(auditObjectId: string, isManual: boolean, assessedBy?: string) {
    const auditObject = await this.prisma.auditObject.findUnique({
      where: { id: auditObjectId },
    });

    if (!auditObject) return null;

    const models = await this.prisma.riskModel.findMany({ where: { isActive: true } });

    const dimensionScores: DimensionScores = {
      financialRisk: 0,
      operationalRisk: 0,
      complianceRisk: 0,
      strategicRisk: 0,
      reputationalRisk: 0,
    };

    const riskFactors = [];

    for (const model of models) {
      const factors = JSON.parse(model.factors as string) || [];
      let dimensionScore = 0;

      for (const factor of factors) {
        const score = this.evaluateFactorRule(factor.rule);
        const weightedScore = score * factor.weight;
        dimensionScore += weightedScore;

        riskFactors.push({
          factorCode: factor.code,
          factorName: factor.name,
          weight: factor.weight,
          score,
          description: `根据规则计算得分: ${score}`,
          dataSource: factor.dataSource,
        });
      }

      const key = `${model.dimensionCode}Risk` as keyof DimensionScores;
      dimensionScores[key] = Math.round(dimensionScore * 100) / 100;
    }

    const totalScore =
      dimensionScores.financialRisk * 0.25 +
      dimensionScores.operationalRisk * 0.25 +
      dimensionScores.complianceRisk * 0.20 +
      dimensionScores.strategicRisk * 0.15 +
      dimensionScores.reputationalRisk * 0.15;

    const riskLevel = this.getRiskLevel(totalScore);

    const assessment = await this.prisma.riskAssessment.create({
      data: {
        auditObjectId,
        previousScore: auditObject.riskScore,
        currentScore: totalScore,
        previousLevel: auditObject.riskLevel,
        currentLevel: riskLevel,
        dimensionScores: JSON.stringify(dimensionScores),
        assessedBy,
        isManual,
        riskFactors: {
          create: riskFactors,
        },
      },
      include: { riskFactors: true },
    });

    await this.prisma.auditObject.update({
      where: { id: auditObjectId },
      data: {
        riskScore: totalScore,
        riskLevel,
        lastAssessmentAt: dayjs().toDate(),
      },
    });

    return {
      auditObjectId,
      auditObjectName: auditObject.name,
      previousScore: auditObject.riskScore,
      currentScore: totalScore,
      previousLevel: auditObject.riskLevel,
      currentLevel: riskLevel,
      dimensionScores,
      riskFactors,
      assessedAt: assessment.assessedAt,
      assessedBy,
    };
  }

  private evaluateFactorRule(rule: string): number {
    try {
      const mockValues = {
        value: Math.random() * 100,
        count: Math.floor(Math.random() * 15),
        anomaly_count: Math.floor(Math.random() * 8),
        avg_days: Math.random() * 40,
        decline: Math.random() * 30,
      };

      let score = 50;
      const func = new Function(...Object.keys(mockValues), `return ${rule}`);
      score = func(...Object.values(mockValues));

      return Math.max(0, Math.min(100, Math.round(score)));
    } catch {
      return Math.round(Math.random() * 60 + 20);
    }
  }

  private getRiskLevel(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  async getAllHistory(query: { page?: number; pageSize?: number; startDate?: string; endDate?: string; auditObjectId?: string; keyword?: string; riskLevel?: string }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.auditObjectId) where.auditObjectId = query.auditObjectId;
    if (query.startDate) where.assessedAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.assessedAt = { ...where.assessedAt, lte: dayjs(query.endDate).toDate() };
    if (query.riskLevel) where.currentLevel = query.riskLevel;
    if (query.keyword) {
      where.auditObject = {
        OR: [
          { name: { contains: query.keyword } },
          { code: { contains: query.keyword } },
        ],
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.riskAssessment.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          auditObject: { select: { id: true, name: true, code: true, contactPerson: true } },
          assessedByUser: { select: { id: true, name: true } },
          riskFactors: true,
        },
        orderBy: { assessedAt: 'desc' },
      }),
      this.prisma.riskAssessment.count({ where }),
    ]);

    const parsedItems = items.map((item) => {
      const scores = JSON.parse(item.dimensionScores as string) || {
        financialRisk: 0,
        operationalRisk: 0,
        complianceRisk: 0,
        strategicRisk: 0,
        reputationalRisk: 0,
      };
      const avgControl = 100 - Math.round(
        ((scores.financialRisk || 0) + (scores.operationalRisk || 0) + (scores.complianceRisk || 0) + (scores.strategicRisk || 0) + (scores.reputationalRisk || 0)) / 5
      );
      return {
        ...item,
        dimensionScores: scores,
        inherentRisk: item.currentScore,
        controlEffectiveness: Math.max(0, Math.min(100, avgControl)),
        residualRisk: Math.round(item.currentScore * (1 - avgControl / 100)),
      };
    });

    return {
      items: parsedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getHistory(auditObjectId: string, query: { page?: number; pageSize?: number; startDate?: string; endDate?: string }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const where: any = { auditObjectId };
    if (query.startDate) where.assessedAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.assessedAt = { ...where.assessedAt, lte: dayjs(query.endDate).toDate() };

    const [items, total] = await Promise.all([
      this.prisma.riskAssessment.findMany({
        where,
        skip,
        take: pageSize,
        include: { riskFactors: true },
        orderBy: { assessedAt: 'desc' },
      }),
      this.prisma.riskAssessment.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      dimensionScores: JSON.parse(item.dimensionScores as string) || {},
    }));

    return {
      items: parsedItems,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
