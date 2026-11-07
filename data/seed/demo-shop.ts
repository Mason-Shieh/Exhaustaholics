export const demoShop = {
  shop: {
    id: "sample-northline",
    name: "Northline Fabrication",
    slug: "northline-demo",
    isSample: true,
  },
  users: [
    { id: "demo-owner", name: "Morgan Lee", role: "owner" },
    { id: "demo-fabricator", name: "Riley Chen", role: "fabricator" },
    { id: "demo-sales", name: "Taylor Park", role: "sales" },
  ],
  customers: [
    { id: "demo-customer-1", name: "Jordan Lee", email: "jordan@example.invalid" },
    { id: "demo-customer-2", name: "Maya Torres", email: "maya@example.invalid" },
    { id: "demo-customer-3", name: "Chris Patel", email: "chris@example.invalid" },
    { id: "demo-customer-4", name: "Alex Morgan", email: "alex@example.invalid" },
    { id: "demo-customer-5", name: "Sam Rivera", email: "sam@example.invalid" },
  ],
  projects: [
    { id: "EX-2048", name: "Street touring system", customerId: "demo-customer-1", vehicleId: "v2", status: "quote_pending", soundLevel: 5, soundPreference: "deep", performancePriority: "medium", budgetBand: "2000", exitStyle: "dual" },
    { id: "EX-2047", name: "Axle-back refresh", customerId: "demo-customer-2", vehicleId: "v1", status: "quote_pending", soundLevel: 7, soundPreference: "aggressive", performancePriority: "high", budgetBand: "2000", exitStyle: "dual" },
    { id: "EX-2044", name: "Weekend track setup", customerId: "demo-customer-3", vehicleId: "v3", status: "awaiting_approval", soundLevel: 8, soundPreference: "race", performancePriority: "high", budgetBand: "5000+", exitStyle: "single" },
    { id: "EX-2041", name: "Valved performance system", customerId: "demo-customer-4", vehicleId: "v4", status: "in_build", soundLevel: 6, soundPreference: "exotic", performancePriority: "high", budgetBand: "5000+", exitStyle: "quad" },
    { id: "EX-2038", name: "Daily driver resonator", customerId: "demo-customer-5", vehicleId: "v2", status: "completed", soundLevel: 3, soundPreference: "mild", performancePriority: "low", budgetBand: "1000", exitStyle: "dual" },
  ],
  isSample: true,
} as const;