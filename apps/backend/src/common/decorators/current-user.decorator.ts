import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = { id: number; email: string };

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const req = ctx.switchToHttp().getRequest<{
      user: { userId: number; email: string };
    }>();
    return { id: req.user.userId, email: req.user.email };
  },
);
