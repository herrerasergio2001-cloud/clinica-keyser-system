import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type CurrentUser = {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  name?: string;
  minsaCode?: string;
};

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): CurrentUser => {
  const request = ctx.switchToHttp().getRequest<{ user: CurrentUser }>();
  return request.user;
});
