import { describe, expect, it } from "vitest";
import { actions, hasRolePermission, roles } from "../policy";
import { getDemoSession, parseDemoRole } from "./mock-session";

describe("mock demo sessions", () => {
  it("maps only fixed demo identities to supported roles", () => {
    for (const role of roles) {
      const session = getDemoSession(role);
      expect(session.role).toBe(role);
      expect(session.userId).toMatch(/^demo-/);
      expect(session.shopId).toBe("00000000-0000-4000-8000-000000000001");
    }
  });

  it("defaults unknown cookies to the demo owner, not a caller-supplied identity", () => {
    expect(getDemoSession("super-admin").userId).toBe("demo-owner");
    expect(parseDemoRole("fabricator")).toBe("fabricator");
    expect(parseDemoRole("user_123")).toBeNull();
  });

  it("keeps demo fabricator quote permissions denied", () => {
    for (const action of actions) {
      expect(hasRolePermission("fabricator", "quotes", action)).toBe(false);
    }
  });
});