import { IsInt, IsString, IsArray, IsOptional, Min, Max } from 'class-validator';

export class AddUpdateDto {
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];
}
