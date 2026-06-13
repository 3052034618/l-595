import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditPlanDto } from './create-audit-plan.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateAuditPlanDto extends PartialType(CreateAuditPlanDto) {
  @IsOptional()
  @IsEnum(['draft', 'approved', 'in_progress', 'completed', 'cancelled'])
  status?: string;
}
