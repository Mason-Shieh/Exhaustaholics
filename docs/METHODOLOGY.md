# Geometry and Pricing Methodology

## Geometry

Coordinates, pipe diameters, bend radii, and lengths are stored in inches. For a polyline with filleted corners, each bend of angle `theta` and radius `R` removes `R * tan(theta / 2)` from each adjacent straight segment and adds an arc of `R * theta`. The calculation rejects a route when the combined tangent trims do not fit on an adjacent segment. The default centerline radius is `1.5 * pipe outside diameter`; node-level overrides are accepted.

Mandrel bends are counted at interior nodes whose turning angle is greater than the configured threshold (5 degrees by default). The returned bend record contains angle and radius for BOM traceability. Dual-system totals are doubled only when the design explicitly sets `mirrored`.

Pipe weight uses the annular cross-section formula:

`weight_lb = (pi / 4) * (OD_in^2 - ID_in^2) * length_in * density_lb_per_in3`

The weight function requires density as an explicit input. No material density defaults are published yet: the 304 stainless, aluminized steel substrate/coating, and titanium grade assumptions still need verified, cited source data. A caller must treat missing density as not set rather than substituting zero or an undocumented constant.

## Quoting

Money is represented in integer cents. Material lines are rounded half up once after `quantity * unitRateCents`. Labor hours are `baseHours + perBendHours * bendCount + perComponentHours * componentCount + perExitHours * exitCount`; labor is rounded once after multiplying by the hourly rate. Consumables, markup, and tax are each rounded once at their respective line. The quote result includes the rate snapshot and the numeric inputs used by every derived line.

Missing material rates, hourly rate, consumables, markup, or tax are reported as unset quote inputs; they are not silently treated as zero. A configured zero remains valid.

## Fitment and Estimates

The centerline is design intent. It does not prove that the route clears a particular vehicle. Vehicle envelope and shop-supplied geometry quality must be displayed with the design, and clearance checks must be labeled as heuristics. Sound level and performance priority are customer goals, not predictions. Analytics such as hours saved require a shop-entered baseline and must be labeled as estimates.