import { IsString, IsArray, IsOptional } from 'class-validator';

export class ReassignDto {
  @IsOptional()
  @IsString()
  leadAuditorId?: string;

  @IsOptional()
  @IsArray()
  auditorIds?: string[];

  @IsOptional()
  @IsString()
  reason?: string;
}
