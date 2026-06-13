import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);

interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<ApiResponse> {
    const data = await this.authService.login(loginDto);
    return {
      code: 0,
      message: '登录成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() body: { refreshToken: string }): Promise<ApiResponse> {
    const data = await this.authService.refreshToken(body.refreshToken);
    return {
      code: 0,
      message: '刷新成功',
      data,
      timestamp: Date.now(),
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): ApiResponse {
    return {
      code: 0,
      message: '登出成功',
      data: null,
      timestamp: Date.now(),
    };
  }
}
