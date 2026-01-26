import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';

export class QueryPositionDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  departmentId?: number;
}
