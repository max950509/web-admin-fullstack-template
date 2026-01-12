import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';

export class QueryUserDto extends PageQueryDto {
  @IsString()
  username?: string;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  roleIds?: number[];
}
