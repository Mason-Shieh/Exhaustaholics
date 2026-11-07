import { z } from "zod";
import { envelopeTemplates, type VehicleClass } from "./vehicle-classes";

const vehicleClassSchema = z.enum(["sports_coupe", "sedan", "hatchback", "truck", "suv"]);

const vehicleSchema = z.object({
  id: z.string().min(1),
  year: z.number().int().min(1950).max(2100),
  make: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().min(1),
  engine: z.string().min(1),
  vehicleClass: vehicleClassSchema,
  envelopeId: z.string().min(1),
  sample: z.literal(true),
});

const sourceRecords = [
  { id: "v1", year: 2021, make: "Ford", model: "Mustang GT", trim: "Premium", engine: "5.0L V8", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v2", year: 2020, make: "BMW", model: "M340i", trim: "xDrive", engine: "3.0L turbo I6", vehicleClass: "sedan", envelopeId: "sedan-v1", sample: true },
  { id: "v3", year: 2018, make: "Subaru", model: "WRX STI", trim: "Limited", engine: "2.5L turbo flat-4", vehicleClass: "sedan", envelopeId: "sedan-v1", sample: true },
  { id: "v4", year: 2023, make: "Chevrolet", model: "Corvette Stingray", trim: "3LT", engine: "6.2L V8", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v5", year: 2022, make: "Toyota", model: "GR Supra", trim: "3.0 Premium", engine: "3.0L turbo I6", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v6", year: 2022, make: "Toyota", model: "Tacoma", trim: "TRD Off-Road", engine: "3.5L V6", vehicleClass: "truck", envelopeId: "truck-v1", sample: true },
  { id: "v7", year: 2021, make: "Chevrolet", model: "Camaro SS", trim: "1SS", engine: "6.2L V8", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v8", year: 2021, make: "Dodge", model: "Challenger R/T", trim: "R/T", engine: "5.7L V8", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v9", year: 2020, make: "Dodge", model: "Charger Scat Pack", trim: "Scat Pack", engine: "6.4L V8", vehicleClass: "sedan", envelopeId: "sedan-v1", sample: true },
  { id: "v10", year: 2023, make: "Honda", model: "Civic Type R", trim: "Type R", engine: "2.0L turbo I4", vehicleClass: "hatchback", envelopeId: "hatchback-v1", sample: true },
  { id: "v11", year: 2022, make: "Volkswagen", model: "Golf R", trim: "R", engine: "2.0L turbo I4", vehicleClass: "hatchback", envelopeId: "hatchback-v1", sample: true },
  { id: "v12", year: 2023, make: "Toyota", model: "GR86", trim: "Premium", engine: "2.4L flat-4", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v13", year: 2023, make: "Subaru", model: "BRZ", trim: "Limited", engine: "2.4L flat-4", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v14", year: 2022, make: "Ford", model: "F-150", trim: "Lariat", engine: "3.5L EcoBoost V6", vehicleClass: "truck", envelopeId: "truck-v1", sample: true },
  { id: "v15", year: 2022, make: "Chevrolet", model: "Silverado 1500", trim: "LT Trail Boss", engine: "5.3L V8", vehicleClass: "truck", envelopeId: "truck-v1", sample: true },
  { id: "v16", year: 2022, make: "Mazda", model: "MX-5 Miata", trim: "Club", engine: "2.0L I4", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v17", year: 2022, make: "Audi", model: "S4", trim: "Premium Plus", engine: "3.0L turbo V6", vehicleClass: "sedan", envelopeId: "sedan-v1", sample: true },
  { id: "v18", year: 2022, make: "Porsche", model: "911 Carrera", trim: "Carrera", engine: "3.0L twin-turbo flat-6", vehicleClass: "sports_coupe", envelopeId: "sports-coupe-v1", sample: true },
  { id: "v19", year: 2022, make: "Toyota", model: "4Runner", trim: "TRD Off-Road", engine: "4.0L V6", vehicleClass: "suv", envelopeId: "suv-v1", sample: true },
  { id: "v20", year: 2022, make: "Lexus", model: "IS 350", trim: "F Sport", engine: "3.5L V6", vehicleClass: "sedan", envelopeId: "sedan-v1", sample: true },
] satisfies z.input<typeof vehicleSchema>[];

export const seedVehicles = z.array(vehicleSchema).parse(sourceRecords);
export type SeedVehicle = (typeof seedVehicles)[number];

export function getEnvelopeTemplate(vehicleClass: VehicleClass) {
  return envelopeTemplates[vehicleClass];
}