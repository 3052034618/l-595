import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ConfirmFindingDto {
  @IsBoolean()
  confirmed: boolean;

  @IsOptional()
  @IsString()
  comment?: string;
}
