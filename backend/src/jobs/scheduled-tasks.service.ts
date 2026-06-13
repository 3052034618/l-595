import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataCollectionService } from '../modules/data-collection/data-collection.service';
import { RiskAssessmentService } from '../modules/risk-assessment/risk-assessment.service';
import { RectificationsService } from '../modules/rectifications/rectifications.service';
import { ReportsService } from '../modules/reports/reports.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import dayjs from 'dayjs';

@Injectable()
export class ScheduledTasksService {
  private readonly logger = new Logger(ScheduledTasksService.name);

  constructor(
    private dataCollectionService: DataCollectionService,
    private riskAssessmentService: RiskAssessmentService,
    private rectificationsService: RectificationsService,
    private reportsService: ReportsService,
    private notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM, {
    name: 'daily_data_collection',
  })
  async handleDailyDataCollection() {
    this.logger.log('开始执行每日数据采集任务...');
    try {
      const result = await this.dataCollectionService.collectAll();
      this.logger.log(`每日数据采集完成，共采集 ${result.total} 条数据`);
    } catch (error) {
      this.logger.error('每日数据采集任务失败', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'daily_risk_assessment',
  })
  async handleDailyRiskAssessment() {
    this.logger.log('开始执行每日风险评估任务...');
    try {
      const result = await this.riskAssessmentService.triggerAssessment({
        isManual: false,
      });
      const highRiskCount = result.filter((r: any) => r?.currentLevel === 'high').length;
      this.logger.log(`每日风险评估完成，共评估 ${result.length} 个对象，高风险 ${highRiskCount} 个`);

      if (highRiskCount > 0) {
        await this.notificationsService.createNotification(
          'system',
          'alert',
          '风险预警',
          `检测到 ${highRiskCount} 个高风险审计对象，请及时关注。`,
          'high',
        );
      }
    } catch (error) {
      this.logger.error('每日风险评估任务失败', error);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM, {
    name: 'daily_overdue_check',
  })
  async handleDailyOverdueCheck() {
    this.logger.log('开始执行每日整改超期检查...');
    try {
      const result = await this.rectificationsService.checkOverdue();
      this.logger.log(`每日整改超期检查完成，共 ${result.updated} 项超期`);

      for (const item of result.items) {
        await this.notificationsService.sendEscalation(item, item.escalationLevel);
      }
    } catch (error) {
      this.logger.error('每日整改超期检查失败', error);
    }
  }

  @Cron('0 0 1 * *', {
    name: 'monthly_report_generation',
  })
  async handleMonthlyReportGeneration() {
    this.logger.log('开始执行月度报告生成任务...');
    try {
      const result = await this.reportsService.generateReport({
        type: 'monthly',
        autoExport: true,
      });
      this.logger.log(`月度报告生成完成：${result.name}`);

      await this.notificationsService.createNotification(
        'system',
        'system',
        '月度报告已生成',
        `${dayjs().subtract(1, 'month').format('YYYY年MM月')}审计报告已生成，请及时查看。`,
        'medium',
        'report',
        result.id,
      );
    } catch (error) {
      this.logger.error('月度报告生成任务失败', error);
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'hourly_alert_check',
  })
  async handleHourlyAlertCheck() {
    this.logger.debug('执行每小时异常预警检查...');
  }
}
