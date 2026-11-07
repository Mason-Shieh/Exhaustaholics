import type { DemoSession } from "./mock-session";

export interface ScopedProjectRecord {
  ownerId: string;
  assignedFabricatorId?: string;
  vehicleId: string;
}

export interface ScopedVehicleRecord {
  id: string;
  ownerId: string;
}

export function scopeProjects<T extends ScopedProjectRecord>(
  projects: readonly T[],
  session: DemoSession,
): T[] {
  if (session.role === "customer") {
    return projects.filter((project) => project.ownerId === session.userId);
  }
  if (session.role === "fabricator") {
    return projects.filter((project) => project.assignedFabricatorId === session.userId);
  }
  return [...projects];
}

export function scopeVehicles<T extends ScopedVehicleRecord>(
  vehicles: readonly T[],
  projects: readonly ScopedProjectRecord[],
  session: DemoSession,
): T[] {
  if (session.role === "customer") {
    return vehicles.filter((vehicle) => vehicle.ownerId === session.userId);
  }
  if (session.role === "fabricator") {
    const assignedVehicleIds = new Set(projects.map((project) => project.vehicleId));
    return vehicles.filter((vehicle) => assignedVehicleIds.has(vehicle.id));
  }
  return [...vehicles];
}