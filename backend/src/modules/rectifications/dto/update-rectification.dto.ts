import { PartialType } from '@nestjs/mapped-types';
import { CreateRectificationDto } from './create-rectification.dto';
import { IsOptional, IsEnum, IsInt, Max, Min } from 'class-validator';

export class UpdateRectificationDto extends PartialType(CreateRectificationDto) {
  @IsOptional()
  @IsEnum(['draft', 'submitted', 'approved', 'in_progress', 'completed', 'overdue'])
  status?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;
}
