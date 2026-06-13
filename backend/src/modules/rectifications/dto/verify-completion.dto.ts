import { IsBoolean, IsString } from 'class-validator';

export class VerifyCompletionDto {
  @IsBoolean()
  passed: boolean;

  @IsString()
  comment: string;
}
