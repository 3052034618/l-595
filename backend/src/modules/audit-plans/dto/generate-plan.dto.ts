import { IsInt, IsBoolean } from 'class-validator';

export class GeneratePlanDto {
  @IsInt()
  year: number;

  @IsBoolean()
  autoAssign: boolean;
}
