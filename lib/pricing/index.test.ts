import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  calculateQuote,
  MissingQuoteInputsError,
  roundHalfUp,
  type QuoteInput,
} from "./index";

function quoteInput(overrides: Partial<QuoteInput> = {}): QuoteInput {
  return {
    materials: [{ key: "pipe", quantity: 1, unitRateCents: 100_000 }],
    labor: {
      baseHours: 10,
      perBendHours: 0,
      bendCount: 0,
      perComponentHours: 0,
      componentCount: 0,
      perExitHours: 0,
      exitCount: 0,
      hourlyRateCents: 10_000,
    },
    consumablesRate: 0.05,
    markupRate: 0.25,
    taxRate: 0.06,
    ...overrides,
  };
}

describe("pricing core", () => {
  it("reproduces the required quote vector in integer cents", () => {
    const result = calculateQuote(quoteInput());
    expect(result.materialsCents).toBe(100_000);
    expect(result.laborCents).toBe(100_000);
    expect(result.consumablesCents).toBe(10_000);
    expect(result.subtotalCents).toBe(210_000);
    expect(result.withMarkupCents).toBe(262_500);
    expect(result.taxCents).toBe(15_750);
    expect(result.totalCents).toBe(278_250);
  });

  it("computes labor hours from base, bend, component, and exit coefficients", () => {
    const result = calculateQuote(quoteInput({
      labor: {
        baseHours: 2,
        perBendHours: 0.5,
        bendCount: 4,
        perComponentHours: 0.25,
        componentCount: 4,
        perExitHours: 0.75,
        exitCount: 2,
        hourlyRateCents: 1_000,
      },
    }));
    expect(result.hours).toBe(6.5);
    expect(result.laborCents).toBe(6_500);
  });

  it("rounds each material line once using round-half-up", () => {
    const result = calculateQuote(quoteInput({
      materials: [
        { key: "first", quantity: 1.5, unitRateCents: 1 },
        { key: "second", quantity: 1.5, unitRateCents: 1 },
      ],
      labor: { ...quoteInput().labor, baseHours: 0, hourlyRateCents: 0 },
      consumablesRate: 0,
      markupRate: 0,
      taxRate: 0,
    }));
    expect(result.materialsCents).toBe(4);
    expect(result.lines.slice(0, 2).map((line) => line.amountCents)).toEqual([2, 2]);
  });

  it("does not silently treat missing price book values as zero", () => {
    try {
      calculateQuote(quoteInput({
        materials: [{ key: "pipe", quantity: 1, unitRateCents: null }],
        markupRate: null,
      }));
      throw new Error("Expected missing quote inputs to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(MissingQuoteInputsError);
      expect((error as MissingQuoteInputsError).missingInputs).toEqual([
        "material rate: pipe",
        "markup rate",
      ]);
    }
  });

  it("returns subtotal when markup and tax are both zero", () => {
    const result = calculateQuote(quoteInput({ markupRate: 0, taxRate: 0 }));
    expect(result.totalCents).toBe(result.subtotalCents);
  });

  it("uses round-half-up for exact half-cent values", () => {
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.49)).toBe(2);
    expect(roundHalfUp(-1.5)).toBe(-2);
  });

  it("rejects negative or fractional cent rates", () => {
    expect(() => calculateQuote(quoteInput({
      materials: [{ key: "pipe", quantity: 1, unitRateCents: 1.5 }],
    }))).toThrow(/integer number of cents/);
    expect(() => calculateQuote(quoteInput({ taxRate: -0.01 }))).toThrow(/non-negative/);
  });

  it("keeps quote totals monotonic in markup, tax, and labor rate", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 200 }), (basisPoints) => {
        const lower = calculateQuote(quoteInput({ markupRate: basisPoints / 10_000 }));
        const higher = calculateQuote(quoteInput({ markupRate: (basisPoints + 1) / 10_000 }));
        expect(higher.totalCents).toBeGreaterThanOrEqual(lower.totalCents);
      }),
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 9_000 }), (basisPoints) => {
        const lower = calculateQuote(quoteInput({ taxRate: basisPoints / 10_000 }));
        const higher = calculateQuote(quoteInput({ taxRate: (basisPoints + 1) / 10_000 }));
        expect(higher.totalCents).toBeGreaterThanOrEqual(lower.totalCents);
      }),
    );
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000 }), (hourlyRateCents) => {
        const lowerInput = quoteInput({
          labor: { ...quoteInput().labor, hourlyRateCents },
        });
        const higherInput = quoteInput({
          labor: { ...quoteInput().labor, hourlyRateCents: hourlyRateCents + 1 },
        });
        expect(calculateQuote(higherInput).totalCents).toBeGreaterThanOrEqual(
          calculateQuote(lowerInput).totalCents,
        );
      }),
    );
  });

  it("rounds no more than half a cent away from each exact line amount", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 1_000, noNaN: true }),
        fc.integer({ min: 0, max: 100_000 }),
        (quantity, rateCents) => {
          const exactCents = quantity * rateCents;
          expect(Math.abs(roundHalfUp(exactCents) - exactCents)).toBeLessThanOrEqual(0.500001);
        },
      ),
    );
  });
});