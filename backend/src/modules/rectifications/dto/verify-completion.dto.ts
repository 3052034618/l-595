import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class VerifyCompletionDto {
  @IsBoolean()
  passed: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
