import { IsOptional, IsString } from 'class-validator';

export class QueryDepartmentDto {
  @IsOptional()
  @IsString()
  name?: string;
}
