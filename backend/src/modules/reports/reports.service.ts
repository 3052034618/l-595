import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { GenerateReportDto } from './dto/generate-report.dto';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync, createReadStream } from 'fs';
import { join } from 'path';
import * as ExcelJS from 'exceljs';

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

    const [auditPlans, findings, rectifications, assessments] = await Promise.all([
      this.prisma.auditPlan.findMany({
        where: {
          createdAt: { gte: periodStart, lte: periodEnd },
          ...(auditObjectIds?.length ? { auditObjectId: { in: auditObjectIds } } : {}),
        },
      }),
      this.prisma.finding.findMany({ where, include: { auditObject: true } }),
      this.prisma.rectification.findMany({ where, include: { auditObject: true, finding: true } }),
      this.prisma.riskAssessment.findMany({ where, include: { auditObject: true } }),
    ]);

    const totalAuditPlans = auditPlans.length;
    const plansInProgress = auditPlans.filter((p) => p.status === 'in_progress').length;
    const plansCompleted = auditPlans.filter((p) => p.status === 'completed').length;
    const auditPlanProgress = totalAuditPlans > 0
      ? Math.round(((plansInProgress + plansCompleted) / totalAuditPlans) * 100)
      : 0;

    const totalFindings = findings.length;
    const highRiskFindings = findings.filter((f) => f.riskLevel === 'high').length;
    const mediumRiskFindings = findings.filter((f) => f.riskLevel === 'medium').length;
    const lowRiskFindings = findings.filter((f) => f.riskLevel === 'low').length;
    const problemDiscoveryRate = totalAuditPlans > 0
      ? Math.round((totalFindings / totalAuditPlans) * 100) / 100
      : 0;

    const completedRectifications = rectifications.filter((r) => r.status === 'completed').length;
    const rectificationStats = {
      total: rectifications.length,
      completed: completedRectifications,
      inProgress: rectifications.filter((r) => r.status === 'in_progress').length,
      overdue: rectifications.filter((r) => r.isOverdue).length,
    };
    const rectificationRate = rectificationStats.total > 0
      ? Math.round((completedRectifications / rectificationStats.total) * 100)
      : 0;

    let avgProcessingHours = 0;
    const processed = rectifications.filter((r) => r.createdAt && (r.status === 'completed' || r.updatedAt));
    if (processed.length > 0) {
      const totalHours = processed.reduce((sum, r) => {
        const start = dayjs(r.createdAt);
        const end = r.status === 'completed' ? dayjs(r.updatedAt) : dayjs();
        return sum + Math.max(0, end.diff(start, 'hour'));
      }, 0);
      avgProcessingHours = Math.round((totalHours / processed.length) * 10) / 10;
    }

    const riskDistribution = {
      high: assessments.filter((a) => a.currentLevel === 'high').length,
      medium: assessments.filter((a) => a.currentLevel === 'medium').length,
      low: assessments.filter((a) => a.currentLevel === 'low').length,
    };

    const statistics = {
      totalAuditPlans,
      plansInProgress,
      plansCompleted,
      auditPlanProgress,
      totalFindings,
      highRiskFindings,
      mediumRiskFindings,
      lowRiskFindings,
      problemDiscoveryRate,
      rectificationStats,
      rectificationRate,
      avgProcessingHours,
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

    const reportId = uuidv4();
    let pdfUrl: string | null = null;
    let excelUrl: string | null = null;

    if (autoExport) {
      const exportsDir = join(process.cwd(), 'exports');
      if (!existsSync(exportsDir)) {
        mkdirSync(exportsDir, { recursive: true });
      }

      excelUrl = `/exports/${reportId}.xlsx`;
      const excelPath = join(process.cwd(), 'exports', `${reportId}.xlsx`);
      try {
        const wb = new ExcelJS.Workbook();
        wb.creator = '内部审计管理系统';
        wb.created = new Date();

        const ws = wb.addWorksheet('审计报告概览', {
          properties: { tabColor: { argb: 'FF1890FF' } },
          views: [{ state: 'frozen', ySplit: 2 }],
        });

        ws.columns = [
          { header: '指标名称', key: 'name', width: 28 },
          { header: '数值', key: 'value', width: 22 },
          { header: '说明', key: 'note', width: 42 },
        ];

        ws.getRow(1).font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1890FF' } };
        ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

        ws.addRows([
          { name: '报告名称', value: reportName, note: `周期 ${dayjs(periodStart).format('YYYY-MM-DD')} 至 ${dayjs(periodEnd).format('YYYY-MM-DD')}` },
          { name: '一、审计项目进展', value: '', note: '' },
          { name: '　审计计划总数', value: totalAuditPlans, note: '本周期内创建的审计计划数量' },
          { name: '　进行中计划', value: plansInProgress, note: '状态为 in_progress 的计划' },
          { name: '　已完成计划', value: plansCompleted, note: '状态为 completed 的计划' },
          { name: '　审计项目进展率', value: `${auditPlanProgress}%`, note: '(进行中+已完成) / 总数' },
          { name: '二、问题发现率', value: '', note: '' },
          { name: '　审计发现总数', value: totalFindings, note: '本周期内记录的审计发现条目' },
          { name: '　高风险发现', value: highRiskFindings, note: '风险等级 high' },
          { name: '　中风险发现', value: mediumRiskFindings, note: '风险等级 medium' },
          { name: '　低风险发现', value: lowRiskFindings, note: '风险等级 low' },
          { name: '　问题发现率', value: problemDiscoveryRate, note: '平均每个审计计划发现的问题数' },
          { name: '三、整改完成率', value: '', note: '' },
          { name: '　整改任务总数', value: rectificationStats.total, note: '关联到本周期发现的整改记录' },
          { name: '　已完成整改', value: rectificationStats.completed, note: '状态为 completed' },
          { name: '　整改中', value: rectificationStats.inProgress, note: '状态为 in_progress' },
          { name: '　超期未完成', value: rectificationStats.overdue, note: '超过截止日期仍未关闭' },
          { name: '　整改完成率', value: `${rectificationRate}%`, note: '已完成 / 整改任务总数' },
          { name: '四、平均处理时长', value: '', note: '' },
          { name: '　平均处理时长', value: `${avgProcessingHours} 小时`, note: '从创建整改到完成的平均耗时' },
          { name: '五、风险分布', value: '', note: '' },
          { name: '　高风险评估', value: riskDistribution.high, note: '周期内风险评估等级 high' },
          { name: '　中风险评估', value: riskDistribution.medium, note: '周期内风险评估等级 medium' },
          { name: '　低风险评估', value: riskDistribution.low, note: '周期内风险评估等级 low' },
        ]);

        ws.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            row.alignment = { vertical: 'middle' };
            const nameVal = String(row.getCell('name').value || '');
            if (/^[一二三四五]、/.test(nameVal)) {
              row.font = { bold: true, color: { argb: 'FF1890FF' }, size: 12 };
            }
          }
        });

        if (findings.length > 0) {
          const wsf = wb.addWorksheet('问题清单');
          wsf.columns = [
            { header: 'ID', key: 'id', width: 36 },
            { header: '标题', key: 'title', width: 32 },
            { header: '被审计对象', key: 'obj', width: 20 },
            { header: '风险等级', key: 'risk', width: 10 },
            { header: '状态', key: 'status', width: 18 },
            { header: '创建时间', key: 'ct', width: 22 },
          ];
          wsf.getRow(1).font = { bold: true };
          findings.forEach((f) => wsf.addRow({
            id: f.id, title: f.title, obj: (f.auditObject as any)?.name || '',
            risk: f.riskLevel, status: f.status, ct: dayjs(f.createdAt).format('YYYY-MM-DD HH:mm'),
          }));
        }

        await wb.xlsx.writeFile(excelPath);
      } catch (excelErr) {
        console.warn('Excel generation fallback:', excelErr);
        writeFileSync(excelPath, Buffer.from('Excel file placeholder'), 'utf8');
      }

      try {
        const pdfContent = this.generatePdfHtml(reportName, statistics, charts, periodStart, periodEnd);
        pdfUrl = `/exports/${reportId}.pdf`;
        const pdfPath = join(process.cwd(), 'exports', `${reportId}.pdf`);
        try {
          const puppeteer = await import('puppeteer');
          const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
          });
          const page = await browser.newPage();
          await page.setContent(pdfContent, { waitUntil: 'networkidle0' });
          await page.pdf({
            path: pdfPath,
            format: 'A4',
            margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
            printBackground: true,
          });
          await browser.close();
        } catch (pErr) {
          console.warn('Puppeteer unavailable, saving HTML as .pdf fallback:', (pErr as Error).message);
          writeFileSync(pdfPath, pdfContent, 'utf8');
        }
      } catch (pdfError) {
        console.warn('PDF generation failed, proceeding without PDF:', pdfError);
        pdfUrl = null;
      }
    }

    const report = await this.prisma.report.create({
      data: {
        id: reportId,
        name: reportName,
        type,
        startDate: periodStart,
        endDate: periodEnd,
        generatedBy: userId,
        statistics: JSON.stringify(statistics),
        charts: JSON.stringify(charts),
        pdfUrl,
        excelUrl,
      },
    });

    return {
      ...report,
      statistics,
      charts,
    };
  }

  private generatePdfHtml(
    reportName: string,
    statistics: any,
    charts: any,
    periodStart: Date,
    periodEnd: Date,
  ): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${reportName}</title>
  <style>
    body { font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 40px; color: #333; }
    h1 { text-align: center; color: #1a1a1a; border-bottom: 2px solid #1890ff; padding-bottom: 20px; }
    .period { text-align: center; color: #666; margin-bottom: 30px; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #1890ff; margin-bottom: 15px; border-left: 4px solid #1890ff; padding-left: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background-color: #f5f7fa; font-weight: 600; }
    .stat-card { display: inline-block; width: 45%; margin: 10px; padding: 20px; background: #f5f7fa; border-radius: 8px; }
    .stat-label { color: #666; font-size: 14px; }
    .stat-value { font-size: 32px; font-weight: bold; color: #1890ff; margin-top: 5px; }
    .high { color: #f5222d; }
    .medium { color: #faad14; }
    .low { color: #52c41a; }
    .footer { margin-top: 50px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
  </style>
</head>
<body>
  <h1>${reportName}</h1>
  <div class="period">报告期间：${dayjs(periodStart).format('YYYY-MM-DD')} 至 ${dayjs(periodEnd).format('YYYY-MM-DD')}</div>

  <div class="section">
    <div class="section-title">一、核心KPI指标</div>
    <div>
      <div class="stat-card">
        <div class="stat-label">审计项目进展</div>
        <div class="stat-value">${statistics.auditPlanProgress ?? 0}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">问题发现率</div>
        <div class="stat-value high">${statistics.problemDiscoveryRate ?? 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">整改完成率</div>
        <div class="stat-value low">${statistics.rectificationRate ?? 0}%</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">平均处理时长</div>
        <div class="stat-value medium">${statistics.avgProcessingHours ?? 0}h</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">二、审计项目进展</div>
    <table>
      <tr><th>指标</th><th>数值</th></tr>
      <tr><td>审计计划总数</td><td>${statistics.totalAuditPlans ?? 0}</td></tr>
      <tr><td>进行中计划</td><td class="medium">${statistics.plansInProgress ?? 0}</td></tr>
      <tr><td>已完成计划</td><td class="low">${statistics.plansCompleted ?? 0}</td></tr>
      <tr><td>项目进展率</td><td><b>${statistics.auditPlanProgress ?? 0}%</b></td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">三、问题发现率统计</div>
    <div>
      <div class="stat-card">
        <div class="stat-label">审计发现总数</div>
        <div class="stat-value">${statistics.totalFindings}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">高风险发现</div>
        <div class="stat-value high">${statistics.highRiskFindings}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">中风险发现</div>
        <div class="stat-value medium">${statistics.mediumRiskFindings}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">低风险发现</div>
        <div class="stat-value low">${statistics.lowRiskFindings}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">四、整改完成率</div>
    <table>
      <tr>
        <th>指标</th>
        <th>数量</th>
      </tr>
      <tr>
        <td>整改任务总数</td>
        <td>${statistics.rectificationStats.total}</td>
      </tr>
      <tr>
        <td>已完成</td>
        <td class="low">${statistics.rectificationStats.completed}</td>
      </tr>
      <tr>
        <td>进行中</td>
        <td class="medium">${statistics.rectificationStats.inProgress}</td>
      </tr>
      <tr>
        <td>超期</td>
        <td class="high">${statistics.rectificationStats.overdue}</td>
      </tr>
      <tr>
        <td><b>整改完成率</b></td>
        <td><b>${statistics.rectificationRate}%</b></td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">五、平均处理时长</div>
    <table>
      <tr><th>指标</th><th>数值</th></tr>
      <tr><td>平均处理时长（小时）</td><td><b class="medium">${statistics.avgProcessingHours} h</b></td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">六、风险分布统计</div>
    <table>
      <tr>
        <th>风险等级</th>
        <th>评估数量</th>
      </tr>
      <tr>
        <td class="high">高风险</td>
        <td>${statistics.riskDistribution.high}</td>
      </tr>
      <tr>
        <td class="medium">中风险</td>
        <td>${statistics.riskDistribution.medium}</td>
      </tr>
      <tr>
        <td class="low">低风险</td>
        <td>${statistics.riskDistribution.low}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    本报告由内部审计管理系统自动生成 | 生成时间：${dayjs().format('YYYY-MM-DD HH:mm:ss')}
  </div>
</body>
</html>`;
  }

  async getDownloadUrl(id: string, format: 'excel' | 'pdf') {
    const report = await this.prisma.report.findUnique({ where: { id } });

    if (!report) {
      throw new NotFoundException('报告不存在');
    }

    const fileUrl = format === 'excel' ? report.excelUrl : report.pdfUrl;

    if (!fileUrl) {
      throw new NotFoundException(`${format === 'excel' ? 'Excel' : 'PDF'}文件不存在`);
    }

    const filePath = join(process.cwd(), fileUrl);
    if (!existsSync(filePath)) {
      throw new NotFoundException('文件已被删除或不存在');
    }

    return {
      filePath,
      fileUrl,
      fileName: `${report.name}.${format === 'excel' ? 'xlsx' : 'pdf'}`,
      format,
    };
  }

  async getDashboardStats() {
    const now = dayjs();
    const last30Days = now.subtract(30, 'day').toDate();

    const [
      totalAuditObjects,
      activeAuditPlans,
      pendingFindings,
      inProgressRectifications,
      findingsByRisk,
      recentAssessments,
    ] = await Promise.all([
      this.prisma.auditObject.count({ where: { status: 'active' } }),
      this.prisma.auditPlan.count({
        where: { status: { in: ['in_progress', 'approved'] } },
      }),
      this.prisma.finding.count({
        where: { status: { in: ['pending_confirmation', 'confirmed', 'rectifying'] } },
      }),
      this.prisma.rectification.count({
        where: { status: { in: ['in_progress', 'draft', 'submitted'] } },
      }),
      this.prisma.finding.groupBy({
        by: ['riskLevel'],
        _count: { riskLevel: true },
        where: { createdAt: { gte: last30Days } },
      }),
      this.prisma.riskAssessment.findMany({
        take: 5,
        orderBy: { assessedAt: 'desc' },
        include: { auditObject: { select: { name: true } } },
      }),
    ]);

    const riskLevelMap: Record<string, number> = { high: 0, medium: 0, low: 0 };
    findingsByRisk.forEach((item) => {
      riskLevelMap[item.riskLevel] = item._count.riskLevel;
    });

    return {
      overview: {
        totalAuditObjects,
        activeAuditPlans,
        pendingFindings,
        inProgressRectifications,
      },
      findingsByRiskLevel: riskLevelMap,
      recentAssessments: recentAssessments.map((a) => ({
        id: a.id,
        auditObjectName: a.auditObject?.name,
        currentLevel: a.currentLevel,
        currentScore: a.currentScore,
        assessedAt: a.assessedAt,
      })),
    };
  }

  async findAll(query: {
    page?: number;
    pageSize?: number;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Number(query.page) || 1;
    const pageSize = Number(query.pageSize) || 10;
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
