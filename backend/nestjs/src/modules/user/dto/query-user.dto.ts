import { IsArray, IsInt, IsOptional, IsString } from 'class-validator';
import { PageQueryDto } from '../../../core/dto/page-query.dto';
import { Type, Transform } from 'class-transformer';

export class QueryUserDto extends PageQueryDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsOptional()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  roleIds?: number[];
}
