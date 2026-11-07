import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  bendArcLength,
  calculatePipeWeightPounds,
  expandMirroredTotals,
  GeometryValidationError,
  measureCenterline,
  totalCenterlineLength,
  type PipeNode,
} from "./index";

function rightAngleNodes(firstLength: number, secondLength: number): PipeNode[] {
  return [
    { id: "a", position: [0, 0, 0] },
    { id: "b", position: [firstLength, 0, 0] },
    { id: "c", position: [firstLength, secondLength, 0] },
  ];
}

describe("geometry core", () => {
  it("measures a straight 100 inch run", () => {
    const result = measureCenterline(
      [
        { id: "a", position: [0, 0, 0] },
        { id: "b", position: [100, 0, 0] },
      ],
      { pipeDiameter: 3 },
    );
    expect(result.lengthInches).toBe(100);
  });

  it("calculates a 90 degree bend arc with the expected radius", () => {
    expect(bendArcLength(4.5, Math.PI / 2)).toBeCloseTo(7.0686, 4);
  });

  it("measures the filleted 100 by 50 inch right-angle path", () => {
    const result = measureCenterline(rightAngleNodes(100, 50), { pipeDiameter: 3 });
    expect(result.lengthInches).toBeCloseTo(148.0686, 4);
    expect(result.bends).toHaveLength(1);
    expect(result.bends[0].radius).toBe(4.5);
  });

  it("counts bends only above the configured threshold", () => {
    const nodes: PipeNode[] = [
      { id: "a", position: [0, 0, 0] },
      { id: "b", position: [100, 0, 0] },
      { id: "c", position: [200, 1, 0] },
    ];
    expect(measureCenterline(nodes, { pipeDiameter: 3 }).bends).toHaveLength(0);
  });

  it("rejects bend radii that cannot fit adjacent segments", () => {
    expect(() => measureCenterline(rightAngleNodes(4, 100), { pipeDiameter: 3 })).toThrow(
      /exceed segment 1 length/,
    );
  });

  it("uses a per-node bend radius override", () => {
    const nodes = rightAngleNodes(100, 50);
    nodes[1].bendRadius = 3;
    expect(measureCenterline(nodes, { pipeDiameter: 3 }).bends[0].radius).toBe(3);
  });

  it("doubles only totals for an explicitly mirrored system", () => {
    const perSide = { pipeLengthInches: 42, bendCount: 3 };
    expect(expandMirroredTotals(perSide, true)).toEqual({
      sideCount: 2,
      pipeLengthInches: 84,
      bendCount: 6,
    });
    expect(expandMirroredTotals(perSide, false)).toEqual({
      sideCount: 1,
      pipeLengthInches: 42,
      bendCount: 3,
    });
  });

  it("computes pipe weight using an explicit material density", () => {
    const weight = calculatePipeWeightPounds({
      outsideDiameterInches: 3,
      wallThicknessInches: 0.065,
      lengthInches: 10,
      densityPoundsPerCubicInch: 0.289,
    });
    const insideDiameter = 3 - 2 * 0.065;
    expect(weight).toBeCloseTo((Math.PI / 4) * (3 ** 2 - insideDiameter ** 2) * 10 * 0.289, 10);
  });

  it("rejects invalid pipe dimensions and coincident nodes", () => {
    expect(() => measureCenterline([], { pipeDiameter: 3 })).toThrow(GeometryValidationError);
    expect(() => calculatePipeWeightPounds({
      outsideDiameterInches: 1,
      wallThicknessInches: 0.5,
      lengthInches: 10,
      densityPoundsPerCubicInch: 0.289,
    })).toThrow(/less than half/);
    expect(() => measureCenterline([
      { id: "a", position: [0, 0, 0] },
      { id: "b", position: [0, 0, 0] },
    ], { pipeDiameter: 3 })).toThrow(/same position/);
  });

  it("keeps centerline length invariant under translation and rotation", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10_000, max: 10_000 }),
        fc.integer({ min: -10_000, max: 10_000 }),
        fc.integer({ min: -10_000, max: 10_000 }),
        fc.integer({ min: 0, max: 359 }),
        fc.integer({ min: 1, max: 30 }),
        (translateX, translateY, translateZ, degrees, pipeDiameter) => {
          const angle = (degrees * Math.PI) / 180;
          const cosine = Math.cos(angle);
          const sine = Math.sin(angle);
          const nodes = rightAngleNodes(100, 60).map((node) => {
            const [x, y, z] = node.position;
            return {
              ...node,
              position: [
                x * cosine - y * sine + translateX,
                x * sine + y * cosine + translateY,
                z + translateZ,
              ] as const,
            };
          });
          const original = measureCenterline(rightAngleNodes(100, 60), { pipeDiameter });
          const transformed = measureCenterline(nodes, { pipeDiameter });
          expect(transformed.lengthInches).toBeCloseTo(original.lengthInches, 7);
        },
      ),
    );
  });

  it("never makes a valid right-angle fillet longer than the sharp path", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 30 }), (pipeDiameter) => {
        const result = measureCenterline(rightAngleNodes(100, 60), { pipeDiameter });
        expect(result.lengthInches).toBeLessThanOrEqual(result.sharpLengthInches);
      }),
    );
  });

  it("returns non-negative lengths and adds lengths across independent routes", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 1000 }), { minLength: 1, maxLength: 10 }),
        (lengths) => {
          const routes = lengths.map((length, index) => [
            { id: `${index}-a`, position: [0, 0, 0] as const },
            { id: `${index}-b`, position: [length, 0, 0] as const },
          ]);
          const total = totalCenterlineLength(routes, { pipeDiameter: 3 });
          expect(total).toBeGreaterThanOrEqual(0);
          expect(total).toBe(lengths.reduce((sum, length) => sum + length, 0));
        },
      ),
    );
  });
});