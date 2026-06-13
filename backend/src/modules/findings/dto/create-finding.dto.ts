import { IsString, IsDateString, IsArray, IsOptional, IsEnum } from 'class-validator';

export class CreateFindingDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  auditPlanId: string;

  @IsString()
  auditObjectId: string;

  @IsOptional()
  @IsEnum(['high', 'medium', 'low'])
  riskLevel?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  evidenceIds?: string[];

  @IsDateString()
  rectificationDeadline: string;
}
