import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interface for the authenticated user attached to request.
 */
export interface AuthenticatedUser {
  userId: string;
  email: string;
}

/**
 * Parameter decorator to extract current user from request.
 * User is attached to request by JWT strategy after token validation.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return this.usersService.findOne(user.userId);
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
