import { IsArray, IsString, IsOptional } from 'class-validator';

export class ExportPackageDto {
  @IsArray()
  evidenceIds: string[];

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsString()
  password?: string;
}
