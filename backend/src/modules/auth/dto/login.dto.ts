import { IsString, IsOptional } from 'class-validator';

export class LoginDto {
  @IsString({ message: '用户名不能为空' })
  username: string;

  @IsString({ message: '密码不能为空' })
  password: string;

  @IsOptional()
  @IsString()
  captcha?: string;
}
