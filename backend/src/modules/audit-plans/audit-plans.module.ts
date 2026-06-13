import { Module } from '@nestjs/common';
import { AuditPlansService } from './audit-plans.service';
import { AuditPlansController } from './audit-plans.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditPlansController],
  providers: [AuditPlansService],
  exports: [AuditPlansService],
})
export class AuditPlansModule {}
