import { describe, expect, it } from "vitest";
import {
  actions,
  canAccess,
  hasRolePermission,
  resources,
  roles,
  type Action,
  type Resource,
  type Role,
} from "./index";

type ExpectedRolePermissions = Record<Role, Partial<Record<Resource, readonly Action[]>>>;

const all = actions;
const expected: ExpectedRolePermissions = {
  owner: Object.fromEntries(resources.map((resource) => [resource, all])) as ExpectedRolePermissions["owner"],
  shop_admin: Object.fromEntries(resources.map((resource) => [resource, all])) as ExpectedRolePermissions["shop_admin"],
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

describe("permissions matrix", () => {
  for (const role of roles) {
    for (const resource of resources) {
      for (const action of actions) {
        it(`${role} ${action} ${resource}`, () => {
          const expectedActions = expected[role][resource] ?? [];
          expect(hasRolePermission(role, resource, action)).toBe(expectedActions.includes(action));
        });
      }
    }
  }

  it("denies unknown roles, resources, and actions by default", () => {
    expect(hasRolePermission("unknown", "projects", "read")).toBe(false);
    expect(hasRolePermission("customer", "unknown", "read")).toBe(false);
    expect(hasRolePermission("customer", "projects", "unknown")).toBe(false);
  });

  it("requires matching tenant scope for shop roles", () => {
    const owner = { id: "owner-1", role: "owner" as const, shopId: "shop-1" };
    expect(canAccess(owner, "quotes", "read", { shopId: "shop-1" })).toBe(true);
    expect(canAccess(owner, "quotes", "read", { shopId: "shop-2" })).toBe(false);
    expect(canAccess(owner, "quotes", "read")).toBe(false);
  });

  it("limits customers to their own records", () => {
    const customer = { id: "customer-1", role: "customer" as const };
    expect(canAccess(customer, "projects", "read", { ownerId: "customer-1" })).toBe(true);
    expect(canAccess(customer, "projects", "read", { ownerId: "customer-2" })).toBe(false);
  });

  it("limits fabricators to assigned work and never grants quote visibility", () => {
    const fabricator = { id: "fabricator-1", role: "fabricator" as const, shopId: "shop-1" };
    expect(canAccess(fabricator, "builds", "read", {
      shopId: "shop-1",
      assignedFabricatorId: "fabricator-1",
    })).toBe(true);
    expect(canAccess(fabricator, "builds", "read", {
      shopId: "shop-1",
      assignedFabricatorId: "fabricator-2",
    })).toBe(false);
    expect(canAccess(fabricator, "quotes", "read", {
      shopId: "shop-1",
      assignedFabricatorId: "fabricator-1",
    })).toBe(false);
  });
});