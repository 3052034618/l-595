import { Module } from '@nestjs/common';
import { RectificationsService } from './rectifications.service';
import { RectificationsController } from './rectifications.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RectificationsController],
  providers: [RectificationsService],
  exports: [RectificationsService],
})
export class RectificationsModule {}
