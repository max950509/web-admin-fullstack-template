import { IsNotEmpty, IsString, Length } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 30)
  password: string;

  @IsNotEmpty()
  @IsString()
  captcha: string;

  @IsNotEmpty()
  @IsString()
  captchaId: string;
}
