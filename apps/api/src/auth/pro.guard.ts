import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard that restricts access to Pro tier users only.
 * Use with @UseGuards(JwtAuthGuard, ProGuard)
 */
@Injectable()
export class ProGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.tier !== 'pro') {
      throw new ForbiddenException('Pro subscription required');
    }

    return true;
  }
}
