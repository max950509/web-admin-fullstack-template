
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  @IsNotEmpty()
  action: string; // e.g., "read", "write", "create", "delete"

  @IsString()
  @IsNotEmpty()
  resource: string; // e.g., "dashboard_menu", "user_management_page"
}
