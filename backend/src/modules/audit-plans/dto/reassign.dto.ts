import { IsString, IsArray, IsOptional } from 'class-validator';

export class ReassignDto {
  @IsOptional()
  @IsString()
  leadAuditorId?: string;

  @IsOptional()
  @IsArray()
  auditorIds?: string[];

  @IsString()
  reason: string;
}
