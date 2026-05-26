import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { resolveApiKey } from '../config/api-key.config';
import { API_ERROR } from '../constants';
import { ApiUnauthorizedException } from '../exceptions/api-exceptions';
import { IS_PUBLIC_KEY } from './public.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly expectedKey = resolveApiKey();

  constructor(private readonly reflector: Reflector) {}

  public canActivate(context: ExecutionContext): boolean {
   const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
     context.getHandler(),
     context.getClass(),
   ]);
   if (isPublic) {
     return true;
   }

   const request = context.switchToHttp().getRequest<{ headers: Record<string, string>; path?: string; url?: string }>();
   const path = request.url ?? request.path ?? '';
   if (path.startsWith('/api/docs') || path === '/api/openapi.json') {
     return true;
   }

   const apiKey = request.headers['x-api-key'];

   if (!apiKey || apiKey !== this.expectedKey) {
     throw new ApiUnauthorizedException(API_ERROR.INVALID_API_KEY);
   }

   return true;
  }
}
