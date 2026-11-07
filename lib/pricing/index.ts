export interface MaterialLineInput {
  key: string;
  quantity: number;
  unitRateCents: number | null;
}

export interface LaborInput {
  baseHours: number;
  perBendHours: number;
  bendCount: number;
  perComponentHours: number;
  componentCount: number;
  perExitHours: number;
  exitCount: number;
  hourlyRateCents: number | null;
}

export interface QuoteInput {
  materials: readonly MaterialLineInput[];
  labor: LaborInput;
  consumablesRate: number | null;
  markupRate: number | null;
  taxRate: number | null;
}

export interface QuoteLine {
  key: string;
  amountCents: number;
  formula: string;
  inputs: Readonly<Record<string, number>>;
}

export interface QuoteResult {
  lines: QuoteLine[];
  hours: number;
  materialsCents: number;
  laborCents: number;
  consumablesCents: number;
  subtotalCents: number;
  withMarkupCents: number;
  markupCents: number;
  taxCents: number;
  totalCents: number;
  rateSnapshot: {
    materialRates: ReadonlyArray<{ key: string; unitRateCents: number }>;
    hourlyRateCents: number;
    consumablesRate: number;
    markupRate: number;
    taxRate: number;
  };
}

export class MissingQuoteInputsError extends Error {
  readonly missingInputs: string[];

  constructor(missingInputs: string[]) {
    super(`Quote inputs not set: ${missingInputs.join(", ")}`);
    this.name = "MissingQuoteInputsError";
    this.missingInputs = missingInputs;
  }
}

export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError("Cannot round a non-finite amount.");
  }
  return value >= 0 ? Math.floor(value + 0.5) : Math.ceil(value - 0.5);
}

function assertNonNegativeFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be finite and non-negative.`);
  }
}

function assertCents(value: number, label: string): void {
  assertNonNegativeFinite(value, label);
  if (!Number.isInteger(value)) {
    throw new RangeError(`${label} must be an integer number of cents.`);
  }
}

function assertRate(value: number | null, label: string): void {
  if (value === null) {
    return;
  }
  assertNonNegativeFinite(value, label);
}

function collectMissingInputs(input: QuoteInput): string[] {
  const missing = input.materials
    .filter((line) => line.unitRateCents === null)
    .map((line) => `material rate: ${line.key}`);
  if (input.labor.hourlyRateCents === null) {
    missing.push("labor hourly rate");
  }
  if (input.consumablesRate === null) {
    missing.push("consumables rate");
  }
  if (input.markupRate === null) {
    missing.push("markup rate");
  }
  if (input.taxRate === null) {
    missing.push("tax rate");
  }
  return missing;
}

export function calculateQuote(input: QuoteInput): QuoteResult {
  const missingInputs = collectMissingInputs(input);
  if (missingInputs.length > 0) {
    throw new MissingQuoteInputsError(missingInputs);
  }

  for (const line of input.materials) {
    assertNonNegativeFinite(line.quantity, `Quantity for ${line.key}`);
    assertCents(line.unitRateCents as number, `Material rate for ${line.key}`);
  }

  const labor = input.labor;
  assertNonNegativeFinite(labor.baseHours, "Base hours");
  assertNonNegativeFinite(labor.perBendHours, "Hours per bend");
  assertNonNegativeFinite(labor.perComponentHours, "Hours per component");
  assertNonNegativeFinite(labor.perExitHours, "Hours per exit");
  assertNonNegativeFinite(labor.bendCount, "Bend count");
  assertNonNegativeFinite(labor.componentCount, "Component count");
  assertNonNegativeFinite(labor.exitCount, "Exit count");
  assertCents(labor.hourlyRateCents as number, "Hourly labor rate");
  assertRate(input.consumablesRate, "Consumables rate");
  assertRate(input.markupRate, "Markup rate");
  assertRate(input.taxRate, "Tax rate");

  const materialLines = input.materials.map((line) => {
    const unitRateCents = line.unitRateCents as number;
    const amountCents = roundHalfUp(line.quantity * unitRateCents);
    return {
      key: line.key,
      amountCents,
      formula: `${line.quantity} x ${unitRateCents} cents/unit`,
      inputs: { quantity: line.quantity, unitRateCents },
    };
  });
  const materialsCents = materialLines.reduce((sum, line) => sum + line.amountCents, 0);
  const hours =
    labor.baseHours +
    labor.perBendHours * labor.bendCount +
    labor.perComponentHours * labor.componentCount +
    labor.perExitHours * labor.exitCount;
  const hourlyRateCents = labor.hourlyRateCents as number;
  const laborCents = roundHalfUp(hours * hourlyRateCents);
  const consumablesRate = input.consumablesRate as number;
  const consumablesCents = roundHalfUp(consumablesRate * (materialsCents + laborCents));
  const subtotalCents = materialsCents + laborCents + consumablesCents;
  const markupRate = input.markupRate as number;
  const markupCents = roundHalfUp(markupRate * subtotalCents);
  const withMarkupCents = subtotalCents + markupCents;
  const taxRate = input.taxRate as number;
  const taxCents = roundHalfUp(taxRate * withMarkupCents);
  const totalCents = withMarkupCents + taxCents;

  const lines: QuoteLine[] = [
    ...materialLines,
    {
      key: "labor",
      amountCents: laborCents,
      formula: `${hours} hours x ${hourlyRateCents} cents/hour`,
      inputs: { hours, hourlyRateCents },
    },
    {
      key: "consumables",
      amountCents: consumablesCents,
      formula: `${consumablesRate} x (${materialsCents} + ${laborCents}) cents`,
      inputs: { consumablesRate, materialsCents, laborCents },
    },
    {
      key: "markup",
      amountCents: markupCents,
      formula: `${markupRate} x ${subtotalCents} cents`,
      inputs: { markupRate, subtotalCents },
    },
    {
      key: "tax",
      amountCents: taxCents,
      formula: `${taxRate} x ${withMarkupCents} cents`,
      inputs: { taxRate, withMarkupCents },
    },
  ];

  return {
    lines,
    hours,
    materialsCents,
    laborCents,
    consumablesCents,
    subtotalCents,
    withMarkupCents,
    markupCents,
    taxCents,
    totalCents,
    rateSnapshot: {
      materialRates: input.materials.map(({ key, unitRateCents: rate }) => ({
        key,
        unitRateCents: rate as number,
      })),
      hourlyRateCents,
      consumablesRate,
      markupRate,
      taxRate,
    },
  };
}