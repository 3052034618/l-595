import { IsString, IsOptional } from 'class-validator';

export class CreateAuditObjectDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contactPerson?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;
}
