import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; displayName: string },
  ) {
    return this.authService.registerEmail(
      body.email,
      body.password,
      body.displayName,
    );
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.loginEmail(body.email, body.password);
  }

  @Post('telegram')
  async telegram(@Body() body: { initData: string }) {
    return this.authService.authTelegram(body.initData);
  }
}
