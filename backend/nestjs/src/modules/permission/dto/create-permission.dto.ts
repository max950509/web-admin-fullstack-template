import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['menu', 'page', 'action'])
  type: string;

  @IsString()
  @IsNotEmpty()
  action: string; // e.g., "read", "write", "create", "delete"

  @IsString()
  @IsNotEmpty()
  resource: string; // e.g., "dashboard_menu", "user_management_page"

  @IsInt()
  @IsOptional()
  parentId?: number;

  @IsInt()
  @IsOptional()
  sort?: number;
}
