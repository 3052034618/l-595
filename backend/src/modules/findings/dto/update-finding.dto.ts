import { PartialType } from '@nestjs/mapped-types';
import { CreateFindingDto } from './create-finding.dto';
import { IsOptional, IsEnum } from 'class-validator';

export class UpdateFindingDto extends PartialType(CreateFindingDto) {
  @IsOptional()
  @IsEnum(['pending_confirmation', 'confirmed', 'rectifying', 'closed'])
  status?: string;
}
