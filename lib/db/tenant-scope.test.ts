import { describe, expect, it } from "vitest";
import { tenantScopeSchema } from "./tenant-scope";

describe("tenant scope validation", () => {
  it("accepts a shop scope", () => {
    expect(tenantScopeSchema.parse({ shopId: "00000000-0000-4000-8000-000000000001" })).toEqual({
      shopId: "00000000-0000-4000-8000-000000000001",
    });
  });

  it("accepts an individual owner scope", () => {
    expect(tenantScopeSchema.parse({ ownerId: "user_123" })).toEqual({ ownerId: "user_123" });
  });

  it("allows owner and shop constraints together", () => {
    expect(tenantScopeSchema.parse({
      shopId: "00000000-0000-4000-8000-000000000001",
      ownerId: "user_123",
    }).ownerId).toBe("user_123");
  });

  it("rejects missing, invalid, and unknown scope fields", () => {
    expect(tenantScopeSchema.safeParse({}).success).toBe(false);
    expect(tenantScopeSchema.safeParse({ shopId: "not-a-uuid" }).success).toBe(false);
    expect(tenantScopeSchema.safeParse({ ownerId: "user_123", tenantId: "other" }).success).toBe(false);
  });
});