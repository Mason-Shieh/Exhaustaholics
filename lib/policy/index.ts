export const roles = ["owner", "shop_admin", "fabricator", "sales", "customer"] as const;
export const resources = [
  "vehicles",
  "customers",
  "projects",
  "revisions",
  "quotes",
  "bom",
  "approvals",
  "statusEvents",
  "builds",
  "invoices",
  "notes",
  "analytics",
  "priceBooks",
  "billing",
  "users",
  "settings",
  "apiKeys",
] as const;
export const actions = ["read", "create", "update", "delete", "approve", "manage"] as const;

export type Role = (typeof roles)[number];
export type Resource = (typeof resources)[number];
export type Action = (typeof actions)[number];
type RoleResourcePermissions = Partial<Record<Resource, readonly Action[]>>;
type PermissionTable = Record<Role, Record<Resource, readonly Action[]>>;

const allActions: readonly Action[] = actions;

function completePermissions(permissions: RoleResourcePermissions): Record<Resource, readonly Action[]> {
  return Object.fromEntries(resources.map((resource) => [resource, permissions[resource] ?? []])) as Record<
    Resource,
    readonly Action[]
  >;
}

const rolePermissions: Record<Role, RoleResourcePermissions> = {
  owner: Object.fromEntries(resources.map((resource) => [resource, allActions])) as RoleResourcePermissions,
  shop_admin: Object.fromEntries(resources.map((resource) => [resource, allActions])) as RoleResourcePermissions,
  fabricator: {
    vehicles: ["read"],
    projects: ["read"],
    revisions: ["read", "create", "update"],
    bom: ["read"],
    statusEvents: ["read", "create"],
    builds: ["read", "update"],
  },
  sales: {
    vehicles: ["read", "create", "update"],
    customers: ["read", "create", "update"],
    projects: ["read", "create", "update"],
    revisions: ["read"],
    quotes: ["read", "create", "update"],
    bom: ["read"],
    approvals: ["read"],
    statusEvents: ["read"],
    builds: ["read"],
    invoices: ["read", "create", "update"],
    notes: ["read", "create", "update"],
    analytics: ["read"],
    priceBooks: ["read"],
  },
  customer: {
    vehicles: ["read", "create", "update"],
    projects: ["read", "create", "update"],
    revisions: ["read"],
    quotes: ["read"],
    bom: ["read"],
    approvals: ["read", "create", "approve"],
    statusEvents: ["read"],
    invoices: ["read"],
  },
};

export const permissionMatrix: PermissionTable = {
  owner: completePermissions(rolePermissions.owner),
  shop_admin: completePermissions(rolePermissions.shop_admin),
  fabricator: completePermissions(rolePermissions.fabricator),
  sales: completePermissions(rolePermissions.sales),
  customer: completePermissions(rolePermissions.customer),
};

export interface PolicyActor {
  id: string;
  role: Role;
  shopId?: string;
}

export interface PolicyTarget {
  shopId?: string;
  ownerId?: string;
  assignedFabricatorId?: string;
}

export function hasRolePermission(role: string, resource: string, action: string): boolean {
  if (
    !roles.includes(role as Role) ||
    !resources.includes(resource as Resource) ||
    !actions.includes(action as Action)
  ) {
    return false;
  }
  return permissionMatrix[role as Role][resource as Resource].includes(action as Action);
}

export function canAccess(
  actor: PolicyActor,
  resource: Resource | string,
  action: Action | string,
  target?: PolicyTarget,
): boolean {
  if (!hasRolePermission(actor.role, resource, action) || !target) {
    return false;
  }

  if (actor.role === "customer") {
    return target.ownerId === actor.id && (!actor.shopId || target.shopId === actor.shopId);
  }

  if (!actor.shopId || target.shopId !== actor.shopId) {
    return false;
  }

  if (actor.role === "fabricator") {
    return target.assignedFabricatorId === actor.id;
  }

  return true;
}