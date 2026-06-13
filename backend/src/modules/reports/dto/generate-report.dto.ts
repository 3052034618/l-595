import { IsEnum, IsOptional, IsArray, IsBoolean, IsString } from 'class-validator';

export class GenerateReportDto {
  @IsEnum(['monthly', 'quarterly', 'annual', 'custom'])
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsArray()
  auditObjectIds?: string[];

  @IsOptional()
  @IsBoolean()
  autoExport?: boolean;
}
