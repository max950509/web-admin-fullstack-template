import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  otpSecret?: string;

  @IsBoolean()
  @IsOptional()
  isOtpEnabled?: boolean;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  roleIds?: number[];

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  departmentId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  positionId?: number | null;
}
