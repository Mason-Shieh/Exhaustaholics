export type Vec3 = readonly [number, number, number];

export interface PipeNode {
  id: string;
  position: Vec3;
  bendRadius?: number;
}

export interface CenterlineOptions {
  pipeDiameter: number;
  bendThresholdDegrees?: number;
}

export interface BendMeasurement {
  nodeId: string;
  angleRadians: number;
  angleDegrees: number;
  radius: number;
}

export interface CenterlineMeasurement {
  lengthInches: number;
  sharpLengthInches: number;
  straightLengthInches: number;
  arcLengthInches: number;
  bends: BendMeasurement[];
}

export interface SideTotals {
  pipeLengthInches: number;
  bendCount: number;
}

export interface SystemTotals extends SideTotals {
  sideCount: number;
}

export class GeometryValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeometryValidationError";
  }
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new GeometryValidationError(`${label} must be a finite positive number.`);
  }
}

function distance(from: Vec3, to: Vec3): number {
  return Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);
}

function dot(left: Vec3, right: Vec3): number {
  return left[0] * right[0] + left[1] * right[1] + left[2] * right[2];
}

function direction(from: Vec3, to: Vec3, length: number): Vec3 {
  return [
    (to[0] - from[0]) / length,
    (to[1] - from[1]) / length,
    (to[2] - from[2]) / length,
  ];
}

export function bendArcLength(radius: number, angleRadians: number): number {
  assertFinitePositive(radius, "Bend radius");
  if (!Number.isFinite(angleRadians) || angleRadians < 0 || angleRadians > Math.PI) {
    throw new GeometryValidationError("Bend angle must be between 0 and 180 degrees.");
  }
  return radius * angleRadians;
}

export function measureCenterline(
  nodes: readonly PipeNode[],
  options: CenterlineOptions,
): CenterlineMeasurement {
  if (nodes.length < 2) {
    throw new GeometryValidationError("A centerline requires at least two nodes.");
  }
  assertFinitePositive(options.pipeDiameter, "Pipe outside diameter");

  const thresholdDegrees = options.bendThresholdDegrees ?? 5;
  if (!Number.isFinite(thresholdDegrees) || thresholdDegrees < 0 || thresholdDegrees >= 180) {
    throw new GeometryValidationError("Bend threshold must be at least 0 and less than 180 degrees.");
  }

  for (const node of nodes) {
    if (node.position.some((coordinate) => !Number.isFinite(coordinate))) {
      throw new GeometryValidationError(`Node ${node.id} has a non-finite position.`);
    }
    if (node.bendRadius !== undefined) {
      assertFinitePositive(node.bendRadius, `Bend radius at node ${node.id}`);
    }
  }

  const segmentLengths = nodes.slice(1).map((node, index) => {
    const length = distance(nodes[index].position, node.position);
    if (length === 0) {
      throw new GeometryValidationError(`Nodes ${nodes[index].id} and ${node.id} cannot occupy the same position.`);
    }
    return length;
  });
  const segmentTrims = segmentLengths.map(() => 0);
  const bends: BendMeasurement[] = [];
  const thresholdRadians = (thresholdDegrees * Math.PI) / 180;
  let arcLengthInches = 0;

  for (let index = 1; index < nodes.length - 1; index += 1) {
    const incomingLength = segmentLengths[index - 1];
    const outgoingLength = segmentLengths[index];
    const incoming = direction(nodes[index - 1].position, nodes[index].position, incomingLength);
    const outgoing = direction(nodes[index].position, nodes[index + 1].position, outgoingLength);
    const cosine = Math.max(-1, Math.min(1, dot(incoming, outgoing)));
    const angleRadians = Math.acos(cosine);

    if (angleRadians <= thresholdRadians) {
      continue;
    }

    const radius = nodes[index].bendRadius ?? 1.5 * options.pipeDiameter;
    const tangentLength = radius * Math.tan(angleRadians / 2);
    if (!Number.isFinite(tangentLength)) {
      throw new GeometryValidationError(`Bend at node ${nodes[index].id} has an unusable radius.`);
    }

    segmentTrims[index - 1] += tangentLength;
    segmentTrims[index] += tangentLength;
    const arcLength = bendArcLength(radius, angleRadians);
    arcLengthInches += arcLength;
    bends.push({
      nodeId: nodes[index].id,
      angleRadians,
      angleDegrees: (angleRadians * 180) / Math.PI,
      radius,
    });
  }

  for (let index = 0; index < segmentLengths.length; index += 1) {
    if (segmentTrims[index] > segmentLengths[index] + 1e-9) {
      throw new GeometryValidationError(
        `Bend tangent lengths (${segmentTrims[index].toFixed(3)} in) exceed segment ${index + 1} length (${segmentLengths[index].toFixed(3)} in). Reduce the bend radius or move the nodes.`,
      );
    }
  }

  const sharpLengthInches = segmentLengths.reduce((total, length) => total + length, 0);
  const straightLengthInches = segmentLengths.reduce(
    (total, length, index) => total + Math.max(0, length - segmentTrims[index]),
    0,
  );

  return {
    lengthInches: straightLengthInches + arcLengthInches,
    sharpLengthInches,
    straightLengthInches,
    arcLengthInches,
    bends,
  };
}

export function totalCenterlineLength(
  routes: readonly (readonly PipeNode[])[],
  options: CenterlineOptions,
): number {
  return routes.reduce((total, route) => total + measureCenterline(route, options).lengthInches, 0);
}

export function expandMirroredTotals(perSide: SideTotals, mirrored: boolean): SystemTotals {
  if (!Number.isFinite(perSide.pipeLengthInches) || perSide.pipeLengthInches < 0) {
    throw new GeometryValidationError("Per-side pipe length must be finite and non-negative.");
  }
  if (!Number.isInteger(perSide.bendCount) || perSide.bendCount < 0) {
    throw new GeometryValidationError("Per-side bend count must be a non-negative integer.");
  }

  const sideCount = mirrored ? 2 : 1;
  return {
    sideCount,
    pipeLengthInches: perSide.pipeLengthInches * sideCount,
    bendCount: perSide.bendCount * sideCount,
  };
}

export interface PipeWeightInput {
  outsideDiameterInches: number;
  wallThicknessInches: number;
  lengthInches: number;
  densityPoundsPerCubicInch: number;
}

export function calculatePipeWeightPounds(input: PipeWeightInput): number {
  assertFinitePositive(input.outsideDiameterInches, "Pipe outside diameter");
  assertFinitePositive(input.wallThicknessInches, "Pipe wall thickness");
  assertFinitePositive(input.densityPoundsPerCubicInch, "Material density");
  if (!Number.isFinite(input.lengthInches) || input.lengthInches < 0) {
    throw new GeometryValidationError("Pipe length must be finite and non-negative.");
  }

  const insideDiameter = input.outsideDiameterInches - 2 * input.wallThicknessInches;
  if (insideDiameter <= 0) {
    throw new GeometryValidationError("Wall thickness must be less than half the outside diameter.");
  }

  const annularArea = (Math.PI / 4) * (input.outsideDiameterInches ** 2 - insideDiameter ** 2);
  return annularArea * input.lengthInches * input.densityPoundsPerCubicInch;
}