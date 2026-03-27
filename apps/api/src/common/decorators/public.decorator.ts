import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Mark an endpoint as publicly accessible — skips Clerk auth guard */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
