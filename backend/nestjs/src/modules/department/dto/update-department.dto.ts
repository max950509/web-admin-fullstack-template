import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  name?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  parentId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sort?: number;
}
