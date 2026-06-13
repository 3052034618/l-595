import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduledTasksService } from './scheduled-tasks.service';
import { DataCollectionModule } from '../modules/data-collection/data-collection.module';
import { RiskAssessmentModule } from '../modules/risk-assessment/risk-assessment.module';
import { RectificationsModule } from '../modules/rectifications/rectifications.module';
import { ReportsModule } from '../modules/reports/reports.module';
import { NotificationsModule } from '../modules/notifications/notifications.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DataCollectionModule,
    RiskAssessmentModule,
    RectificationsModule,
    ReportsModule,
    NotificationsModule,
  ],
  providers: [ScheduledTasksService],
})
export class JobsModule {}
