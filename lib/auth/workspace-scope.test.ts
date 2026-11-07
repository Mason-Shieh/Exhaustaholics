import { describe, expect, it } from "vitest";
import { getDemoSession } from "./mock-session";
import { scopeProjects, scopeVehicles } from "./workspace-scope";

const projects = [
  { id: "customer-project", ownerId: "demo-customer-1", assignedFabricatorId: "demo-fabricator", vehicleId: "vehicle-a" },
  { id: "other-customer-project", ownerId: "demo-customer-2", vehicleId: "vehicle-b" },
  { id: "unassigned-project", ownerId: "demo-customer-3", vehicleId: "vehicle-c" },
];
const vehicles = [
  { id: "vehicle-a", ownerId: "demo-customer-1" },
  { id: "vehicle-b", ownerId: "demo-customer-2" },
  { id: "vehicle-c", ownerId: "demo-customer-3" },
];

describe("demo workspace data scope", () => {
  it("limits customers to their own projects and vehicles", () => {
    const session = getDemoSession("customer");
    const visibleProjects = scopeProjects(projects, session);
    expect(visibleProjects.map((project) => project.id)).toEqual(["customer-project"]);
    expect(scopeVehicles(vehicles, visibleProjects, session).map((vehicle) => vehicle.id)).toEqual(["vehicle-a"]);
  });

  it("limits fabricators to assigned builds and their vehicle records", () => {
    const session = getDemoSession("fabricator");
    const visibleProjects = scopeProjects(projects, session);
    expect(visibleProjects.map((project) => project.id)).toEqual(["customer-project"]);
    expect(scopeVehicles(vehicles, visibleProjects, session).map((vehicle) => vehicle.id)).toEqual(["vehicle-a"]);
  });

  it("preserves shop-wide records for authorized shop roles", () => {
    const session = getDemoSession("sales");
    expect(scopeProjects(projects, session)).toHaveLength(3);
    expect(scopeVehicles(vehicles, projects, session)).toHaveLength(3);
  });
});