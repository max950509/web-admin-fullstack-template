import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  parentId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  sort?: number;
}
