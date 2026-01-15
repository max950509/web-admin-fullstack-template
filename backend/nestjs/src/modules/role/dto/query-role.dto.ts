import { IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';

export class QueryRoleDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  name?: string;
}
