import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';

export class QueryOperationLogDto extends PageQueryDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  resource?: string;

  @IsOptional()
  @IsString()
  method?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  statusCode?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  userId?: number;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
