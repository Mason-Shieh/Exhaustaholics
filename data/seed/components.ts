export const componentCatalog = [
  { id: "catalytic-converter", name: "Catalytic converter", category: "emissions", unit: "each", samplePriceCents: 32500 },
  { id: "resonator", name: "Resonator", category: "sound", unit: "each", samplePriceCents: 14500 },
  { id: "muffler", name: "Muffler", category: "sound", unit: "each", samplePriceCents: 21800 },
  { id: "x-pipe", name: "X-pipe", category: "crossover", unit: "each", samplePriceCents: 12900 },
  { id: "h-pipe", name: "H-pipe", category: "crossover", unit: "each", samplePriceCents: 11900 },
  { id: "y-pipe", name: "Y-pipe", category: "splitter", unit: "each", samplePriceCents: 9900 },
  { id: "turn-down", name: "Turn-down", category: "exit", unit: "each", samplePriceCents: 4800 },
  { id: "exhaust-tip", name: "Exhaust tip", category: "exit", unit: "each", samplePriceCents: 8900 },
  { id: "valve-system", name: "Valve system", category: "control", unit: "set", samplePriceCents: 89500 },
  { id: "v-band", name: "V-band clamp", category: "hardware", unit: "each", samplePriceCents: 3200 },
  { id: "flange", name: "Flange", category: "hardware", unit: "each", samplePriceCents: 2500 },
] as const;

export type ComponentCatalogId = (typeof componentCatalog)[number]["id"];