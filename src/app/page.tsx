import ShopWorkspace from "@/components/shop-workspace";
import { seedVehicles } from "../../data/seed/vehicles";

const vehicles = seedVehicles.map((vehicle) => ({
  id: vehicle.id,
  year: vehicle.year,
  make: vehicle.make,
  model: vehicle.model,
  trim: vehicle.trim,
  engine: vehicle.engine,
  envelope: "Parametric envelope",
  sample: vehicle.sample,
}));

export default function Home() {
  return <ShopWorkspace initialVehicles={vehicles} />;
}
