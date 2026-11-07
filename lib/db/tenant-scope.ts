import { z } from "zod";

export const tenantScopeSchema = z.object({
  shopId: z.string().uuid().optional(),
  ownerId: z.string().min(1).optional(),
}).strict().refine(
  (scope) => scope.shopId !== undefined || scope.ownerId !== undefined,
  "A shopId or ownerId tenant scope is required.",
);

export type TenantScope = z.infer<typeof tenantScopeSchema>;