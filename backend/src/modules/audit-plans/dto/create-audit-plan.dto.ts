import { IsString, IsInt, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateAuditPlanDto {
  @IsInt()
  year: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  auditObjectId: string;

  @IsString()
  leadAuditorId: string;

  @IsArray()
  auditorIds: string[];
}
