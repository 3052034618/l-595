import { IsString, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateRectificationDto {
  @IsString()
  findingId: string;

  @IsString()
  plan: string;

  @IsArray()
  measures: string[];

  @IsString()
  responsiblePersonId: string;

  @IsDateString()
  expectedCompletionDate: string;

  @IsOptional()
  @IsString()
  expectedEffect?: string;
}
