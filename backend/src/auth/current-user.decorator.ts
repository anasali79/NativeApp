import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Extracts the userId from the request (set by JwtAuthGuard) */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.userId;
  },
);
