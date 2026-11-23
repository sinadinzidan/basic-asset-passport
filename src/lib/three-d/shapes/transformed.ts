import {
  BOX_HALF,
  FULL_CIRCLE_SEGMENTS,
  FULL_TURN,
  NUT_SIDES,
  TORUS_ARC_SEGMENTS,
  TORUS_TUBE_SEGMENTS,
} from '../../../constants/threeD';
import type { Vector } from '../../../types/threeD';
import type { MeshBuilder } from '../meshBuilder';
import {
  add,
  cross,
  normalize,
  scale,
  subtract,
  transformDirection,
  transformPoint,
  UNIT_AXES,
} from '../vectors';

import { resolveArc, segmentsFor } from './arcs';

const SIGNS = [1, -1] as const;

const FACE_CORNERS = [
  [-1, -1],
  [1, -1],
  [1, 1],
  [-1, 1],
] as const;

const UNIT_Z: Vector = [0, 0, 1];
const NUT_STEP = FULL_TURN / NUT_SIDES;
const TORUS_FULL_TURN_TUBE = FULL_TURN;

export function addBox(builder: MeshBuilder, matrix: ArrayLike<number>): void {
  UNIT_AXES.forEach((normalAxis, axisIndex) => {
    const firstAxis = UNIT_AXES[(axisIndex + 1) % UNIT_AXES.length];
    const secondAxis = UNIT_AXES[(axisIndex + UNIT_AXES.length - 1) % UNIT_AXES.length];

    SIGNS.forEach((sign) => {
      const faceCenter = scale(normalAxis, sign * BOX_HALF);

      const corners = FACE_CORNERS.map(([firstSign, secondSign]) =>
        transformPoint(
          matrix,
          add(
            faceCenter,
            add(scale(firstAxis, firstSign * BOX_HALF), scale(secondAxis, secondSign * BOX_HALF)),
          ),
        ),
      );

      builder.addFlatPolygon(corners, transformDirection(matrix, scale(normalAxis, sign)));
    });
  });
}

export function addQuad(builder: MeshBuilder, matrix: ArrayLike<number>): void {
  const corners = FACE_CORNERS.map(([firstSign, secondSign]) =>
    transformPoint(matrix, [firstSign * BOX_HALF, secondSign * BOX_HALF, 0]),
  );

  builder.addFlatPolygon(corners, transformDirection(matrix, UNIT_Z));
}

export function addNut(builder: MeshBuilder, matrix: ArrayLike<number>): void {
  const rim = Array.from({ length: NUT_SIDES }, (_item, side): Vector => [
    BOX_HALF * Math.sin(side * NUT_STEP),
    BOX_HALF * Math.cos(side * NUT_STEP),
    0,
  ]);

  const lower = rim.map((point) => transformPoint(matrix, add(point, [0, 0, -BOX_HALF])));
  const upper = rim.map((point) => transformPoint(matrix, add(point, [0, 0, BOX_HALF])));

  rim.forEach((_point, side) => {
    const next = (side + 1) % NUT_SIDES;
    const outward = transformDirection(matrix, add(rim[side], rim[next]));

    builder.addFlatPolygon([lower[side], lower[next], upper[next], upper[side]], outward);
  });

  builder.addFlatPolygon(lower, transformDirection(matrix, scale(UNIT_Z, -1)));
  builder.addFlatPolygon(upper, transformDirection(matrix, UNIT_Z));
}

export function addAnnulusSector(
  builder: MeshBuilder,
  matrix: ArrayLike<number>,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  arcAngle: number,
): void {
  const arc = resolveArc(arcAngle);
  const segments = segmentsFor(arc, FULL_CIRCLE_SEGMENTS);
  const normal = normalize(transformDirection(matrix, UNIT_Z));
  let previousInner = -1;
  let previousOuter = -1;

  for (let step = 0; step <= segments; step += 1) {
    const angle = startAngle + (arc * step) / segments;
    const direction: Vector = [Math.cos(angle), Math.sin(angle), 0];
    const inner = builder.addVertex(transformPoint(matrix, scale(direction, innerRadius)), normal);
    const outer = builder.addVertex(transformPoint(matrix, scale(direction, outerRadius)), normal);

    if (step > 0) {
      builder.addTriangle(previousInner, previousOuter, outer);
      builder.addTriangle(previousInner, outer, inner);
    }

    previousInner = inner;
    previousOuter = outer;
  }
}

export function addTorusSegment(
  builder: MeshBuilder,
  matrix: ArrayLike<number>,
  arcAngle: number,
  radius: number,
  tubeRadius: number,
): void {
  const arcSegments = segmentsFor(resolveArc(arcAngle), TORUS_ARC_SEGMENTS);
  const arc = resolveArc(arcAngle);
  const rows: number[][] = [];

  for (let arcStep = 0; arcStep <= arcSegments; arcStep += 1) {
    const theta = (arc * arcStep) / arcSegments;
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const center = transformPoint(matrix, [radius * cosTheta, radius * sinTheta, 0]);
    const row: number[] = [];

    for (let tubeStep = 0; tubeStep < TORUS_TUBE_SEGMENTS; tubeStep += 1) {
      const phi = (TORUS_FULL_TURN_TUBE * tubeStep) / TORUS_TUBE_SEGMENTS;
      const ring = radius + tubeRadius * Math.cos(phi);

      const point = transformPoint(matrix, [
        ring * cosTheta,
        ring * sinTheta,
        tubeRadius * Math.sin(phi),
      ]);

      row.push(builder.addVertex(point, normalize(subtract(point, center))));
    }

    rows.push(row);
  }

  for (let arcStep = 1; arcStep < rows.length; arcStep += 1) {
    for (let tubeStep = 0; tubeStep < TORUS_TUBE_SEGMENTS; tubeStep += 1) {
      const nextTube = (tubeStep + 1) % TORUS_TUBE_SEGMENTS;
      const previous = rows[arcStep - 1];
      const current = rows[arcStep];

      builder.addTriangle(previous[tubeStep], current[tubeStep], current[nextTube]);
      builder.addTriangle(previous[tubeStep], current[nextTube], previous[nextTube]);
    }
  }
}

export function planeNormal(first: Vector, second: Vector, third: Vector): Vector {
  return normalize(cross(subtract(second, first), subtract(third, first)));
}
