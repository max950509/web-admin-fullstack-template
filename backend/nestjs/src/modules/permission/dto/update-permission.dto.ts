import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  @IsIn(['menu', 'page', 'action'])
  type?: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsString()
  @IsOptional()
  resource?: string;

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @IsOptional()
  sort?: number;
}
