import { Module } from '@nestjs/common';
import { RiskAssessmentService } from './risk-assessment.service';
import { RiskAssessmentController } from './risk-assessment.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RiskAssessmentController],
  providers: [RiskAssessmentService],
  exports: [RiskAssessmentService],
})
export class RiskAssessmentModule {}
