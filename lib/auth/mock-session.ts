import { z } from "zod";
import { roles, type Role } from "../policy";

export const demoShopId = "00000000-0000-4000-8000-000000000001";
export const demoRoleSchema = z.enum(roles);

export interface DemoSession {
  userId: string;
  displayName: string;
  role: Role;
  shopId: string;
  ownerId?: string | null;
}

const demoSessions: Record<Role, DemoSession> = {
  owner: { userId: "demo-owner", displayName: "Morgan Lee", role: "owner", shopId: demoShopId },
  shop_admin: { userId: "demo-admin", displayName: "Casey Brooks", role: "shop_admin", shopId: demoShopId },
  fabricator: { userId: "demo-fabricator", displayName: "Riley Chen", role: "fabricator", shopId: demoShopId },
  sales: { userId: "demo-sales", displayName: "Taylor Park", role: "sales", shopId: demoShopId },
  customer: { userId: "demo-customer-1", displayName: "Jordan Lee", role: "customer", shopId: demoShopId, ownerId: "demo-customer-1" },
};

export function getDemoSession(role: unknown): DemoSession {
  const parsedRole = demoRoleSchema.safeParse(role);
  return parsedRole.success ? demoSessions[parsedRole.data] : demoSessions.owner;
}

export function parseDemoRole(value: unknown): Role | null {
  const result = demoRoleSchema.safeParse(value);
  return result.success ? result.data : null;
}