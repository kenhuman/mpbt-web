import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { verifyJwt, JwtPayload } from './jwt';

// Attach the verified JWT payload to the request object.
export interface AuthRequest extends Request {
  user: JwtPayload;
}

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.['mpbt_token'];
    if (!token) throw new UnauthorizedException('Not authenticated');
    const payload = verifyJwt(token);
    if (!payload) throw new UnauthorizedException('Invalid or expired session');
    req.user = payload;
    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthRequest>();
    const token = req.cookies?.['mpbt_token'];
    if (!token) throw new UnauthorizedException('Not authenticated');
    const payload = verifyJwt(token);
    if (!payload) throw new UnauthorizedException('Invalid or expired session');
    if (!payload.isAdmin) throw new ForbiddenException('Admin access required');
    req.user = payload;
    return true;
  }
}
