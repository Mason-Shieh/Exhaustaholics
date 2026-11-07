import { describe, expect, it } from "vitest";
import { componentCatalog } from "./components";
import { demoShop } from "./demo-shop";
import { samplePriceBook, unconfiguredPriceBook } from "./price-book";
import { getEnvelopeTemplate, seedVehicles } from "./vehicles";

describe("demo seed data", () => {
  it("includes twenty sample vehicles with class-based envelopes", () => {
    expect(seedVehicles).toHaveLength(20);
    expect(new Set(seedVehicles.map((vehicle) => vehicle.id)).size).toBe(20);
    for (const vehicle of seedVehicles) {
      expect(vehicle.sample).toBe(true);
      expect(getEnvelopeTemplate(vehicle.vehicleClass).wheelbaseInches).toBeGreaterThan(0);
    }
  });

  it("includes the common exhaust and hardware catalog", () => {
    expect(componentCatalog.map((component) => component.id)).toEqual(expect.arrayContaining([
      "catalytic-converter", "resonator", "muffler", "x-pipe", "h-pipe", "y-pipe",
      "turn-down", "exhaust-tip", "valve-system", "v-band", "flange",
    ]));
    expect(componentCatalog.every((component) => component.samplePriceCents >= 0)).toBe(true);
  });

  it("marks demo records and sample rates explicitly", () => {
    expect(demoShop.isSample).toBe(true);
    expect(demoShop.shop.isSample).toBe(true);
    expect(samplePriceBook.isSample).toBe(true);
    expect(unconfiguredPriceBook.hourlyRateCents).toBeNull();
    expect(unconfiguredPriceBook.markupRate).toBeNull();
  });
});