import { Module } from '@nestjs/common';
import { AuditObjectsService } from './audit-objects.service';
import { AuditObjectsController } from './audit-objects.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AuditObjectsController],
  providers: [AuditObjectsService],
  exports: [AuditObjectsService],
})
export class AuditObjectsModule {}
