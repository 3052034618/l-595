import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generateReport(generateReportDto: GenerateReportDto, userId?: string) {
    const { type, startDate, endDate, auditObjectIds, autoExport } = generateReportDto;

    let periodStart: Date;
    let periodEnd: Date;
    let reportName: string;

    const now = dayjs();

    switch (type) {
      case 'monthly':
        periodStart = now.subtract(1, 'month').startOf('month').toDate();
        periodEnd = now.subtract(1, 'month').endOf('month').toDate();
        reportName = `${dayjs(periodStart).format('YYYY年MM月')}审计报告`;
        break;
      case 'quarterly':
        periodStart = now.subtract(3, 'month').startOf('month').toDate();
        periodEnd = now.subtract(1, 'month').endOf('month').toDate();
        reportName = `${dayjs(periodStart).format('YYYY年')}季度审计报告`;
        break;
      case 'annual':
        periodStart = now.subtract(1, 'year').startOf('year').toDate();
        periodEnd = now.subtract(1, 'year').endOf('year').toDate();
        reportName = `${dayjs(periodStart).format('YYYY年')}年度审计报告`;
        break;
      case 'custom':
        if (!startDate || !endDate) {
          throw new Error('自定义报告需要指定开始和结束日期');
        }
        periodStart = dayjs(startDate).toDate();
        periodEnd = dayjs(endDate).toDate();
        reportName = `自定义审计报告 (${dayjs(periodStart).format('YYYY-MM-DD')} 至 ${dayjs(periodEnd).format('YYYY-MM-DD')})`;
        break;
      default:
        periodStart = now.subtract(1, 'month').startOf('month').toDate();
        periodEnd = now.subtract(1, 'month').endOf('month').toDate();
        reportName = `${dayjs(periodStart).format('YYYY年MM月')}审计报告`;
    }

    const where: any = {
      createdAt: { gte: periodStart, lte: periodEnd },
    };

    if (auditObjectIds?.length) {
      where.auditObjectId = { in: auditObjectIds };
    }

    const [findings, rectifications, assessments] = await Promise.all([
      this.prisma.finding.findMany({ where, include: { auditObject: true } }),
      this.prisma.rectification.findMany({ where, include: { auditObject: true, finding: true } }),
      this.prisma.riskAssessment.findMany({ where, include: { auditObject: true } }),
    ]);

    const totalFindings = findings.length;
    const highRiskFindings = findings.filter((f) => f.riskLevel === 'high').length;
    const mediumRiskFindings = findings.filter((f) => f.riskLevel === 'medium').length;
    const lowRiskFindings = findings.filter((f) => f.riskLevel === 'low').length;

    const rectificationStats = {
      total: rectifications.length,
      completed: rectifications.filter((r) => r.status === 'completed').length,
      inProgress: rectifications.filter((r) => r.status === 'in_progress').length,
      overdue: rectifications.filter((r) => r.isOverdue).length,
    };

    const riskDistribution = {
      high: assessments.filter((a) => a.currentLevel === 'high').length,
      medium: assessments.filter((a) => a.currentLevel === 'medium').length,
      low: assessments.filter((a) => a.currentLevel === 'low').length,
    };

    const statistics = {
      totalFindings,
      highRiskFindings,
      mediumRiskFindings,
      lowRiskFindings,
      rectificationStats,
      riskDistribution,
    };

    const charts = {
      riskDistribution: [
        { name: '高风险', value: riskDistribution.high },
        { name: '中风险', value: riskDistribution.medium },
        { name: '低风险', value: riskDistribution.low },
      ],
      rectificationProgress: [
        { name: '已完成', value: rectificationStats.completed },
        { name: '进行中', value: rectificationStats.inProgress },
        { name: '超期', value: rectificationStats.overdue },
      ],
    };

    const report = await this.prisma.report.create({
      data: {
        id: uuidv4(),
        name: reportName,
        type,
        startDate: periodStart,
        endDate: periodEnd,
        generatedBy: userId,
        statistics: JSON.stringify(statistics),
        charts: JSON.stringify(charts),
        pdfUrl: autoExport ? `/exports/${uuidv4()}.pdf` : null,
      },
    });

    return {
      ...report,
      statistics,
      charts,
    };
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 10;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (query.type) where.type = query.type;
    if (query.startDate) where.generatedAt = { gte: dayjs(query.startDate).toDate() };
    if (query.endDate) where.generatedAt = { ...where.generatedAt, lte: dayjs(query.endDate).toDate() };

    const [items, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: pageSize,
        include: { generatedByUser: { select: { id: true, name: true } } },
        orderBy: { generatedAt: 'desc' },
      }),
      this.prisma.report.count({ where }),
    ]);

    const parsedItems = items.map((item) => ({
      ...item,
      statistics: JSON.parse(item.statistics as string) || {},
      charts: JSON.parse(item.charts as string) || {},
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
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: { generatedByUser: { select: { id: true, name: true } } },
    });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    return {
      ...report,
      statistics: JSON.parse(report.statistics as string) || {},
      charts: JSON.parse(report.charts as string) || {},
    };
  }

  async exportReport(id: string, format: 'pdf' | 'excel' = 'pdf') {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    const fileUrl = `/exports/${uuidv4()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;

    const updateData: any = {};
    if (format === 'pdf') {
      updateData.pdfUrl = fileUrl;
    } else {
      updateData.excelUrl = fileUrl;
    }

    await this.prisma.report.update({
      where: { id },
      data: updateData,
    });

    return {
      ...report,
      fileUrl,
      format,
    };
  }

  async delete(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    return this.prisma.report.delete({ where: { id } });
  }
}
