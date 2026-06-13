import { PartialType } from '@nestjs/mapped-types';
import { CreateAuditObjectDto } from './create-audit-object.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateAuditObjectDto extends PartialType(CreateAuditObjectDto) {
  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: string;
}
