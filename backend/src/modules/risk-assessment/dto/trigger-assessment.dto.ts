import { IsBoolean, IsArray, IsOptional } from 'class-validator';

export class TriggerAssessmentDto {
  @IsOptional()
  @IsArray()
  auditObjectIds?: string[];

  @IsBoolean()
  isManual: boolean;
}
