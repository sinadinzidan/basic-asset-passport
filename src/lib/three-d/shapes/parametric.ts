import { ELLIPSOID_RINGS, FULL_CIRCLE_SEGMENTS, FULL_TURN } from '../../../constants/threeD';
import type { Vector } from '../../../types/threeD';
import type { MeshBuilder } from '../meshBuilder';
import {
  add,
  combine,
  cross,
  dot,
  length,
  normalize,
  perpendicularTo,
  scale,
  subtract,
} from '../vectors';

import { isFullTurn, resolveArc, segmentsFor } from './arcs';

const ORIGIN: Vector = [0, 0, 0];

export type FrustumInput = {
  centerA: Vector;
  centerB: Vector;
  radiusA: number;
  radiusB: number;
  localX: Vector;
  startAngle: number;
  arcAngle: number;
};

export type EccentricConeInput = {
  centerA: Vector;
  centerB: Vector;
  radiusA: number;
  radiusB: number;
  normal: Vector;
};

export type EllipsoidInput = {
  center: Vector;
  normal: Vector;
  horizontalRadius: number;
  verticalRadius: number;
  height: number;
};

type Frame = {
  axis: Vector;
  xAxis: Vector;
  yAxis: Vector;
};

function frameFor(axis: Vector, reference: Vector | null): Frame {
  const unitAxis = normalize(axis);

  const projected =
    reference === null ? ORIGIN : subtract(reference, scale(unitAxis, dot(reference, unitAxis)));

  const xAxis = normalize(projected, perpendicularTo(unitAxis));

  return { axis: unitAxis, xAxis, yAxis: cross(unitAxis, xAxis) };
}

function addDisc(
  builder: MeshBuilder,
  center: Vector,
  frame: Frame,
  radius: number,
  normal: Vector,
  startAngle: number,
  arc: number,
): void {
  const segments = segmentsFor(arc, FULL_CIRCLE_SEGMENTS);
  const centerIndex = builder.addVertex(center, normal);
  let previous = -1;

  for (let step = 0; step <= segments; step += 1) {
    const angle = startAngle + (arc * step) / segments;

    const rim = combine(
      center,
      frame.xAxis,
      Math.cos(angle) * radius,
      frame.yAxis,
      Math.sin(angle) * radius,
    );

    const index = builder.addVertex(rim, normal);

    if (step > 0) builder.addTriangle(centerIndex, previous, index);

    previous = index;
  }
}

export function addFrustum(builder: MeshBuilder, input: FrustumInput): void {
  const { centerA, centerB, radiusA, radiusB } = input;
  const span = subtract(centerB, centerA);
  const height = length(span);
  const frame = frameFor(span, input.localX);
  const arc = resolveArc(input.arcAngle);
  const segments = segmentsFor(arc, FULL_CIRCLE_SEGMENTS);
  let previousA = -1;
  let previousB = -1;

  for (let step = 0; step <= segments; step += 1) {
    const angle = input.startAngle + (arc * step) / segments;
    const radial = combine(ORIGIN, frame.xAxis, Math.cos(angle), frame.yAxis, Math.sin(angle));

    const normal = normalize(
      add(scale(radial, height), scale(frame.axis, radiusA - radiusB)),
      radial,
    );

    const indexA = builder.addVertex(add(centerA, scale(radial, radiusA)), normal);
    const indexB = builder.addVertex(add(centerB, scale(radial, radiusB)), normal);

    if (step > 0) {
      builder.addTriangle(previousA, previousB, indexB);
      builder.addTriangle(previousA, indexB, indexA);
    }

    previousA = indexA;
    previousB = indexB;
  }

  if (isFullTurn(arc)) {
    addDisc(builder, centerA, frame, radiusA, scale(frame.axis, -1), input.startAngle, arc);
    addDisc(builder, centerB, frame, radiusB, frame.axis, input.startAngle, arc);
  }
}

export function addEccentricCone(builder: MeshBuilder, input: EccentricConeInput): void {
  const { centerA, centerB, radiusA, radiusB } = input;
  const frame = frameFor(input.normal, null);
  const segments = segmentsFor(FULL_TURN, FULL_CIRCLE_SEGMENTS);
  const span = subtract(centerB, centerA);
  let previousA = -1;
  let previousB = -1;

  for (let step = 0; step <= segments; step += 1) {
    const angle = (FULL_TURN * step) / segments;
    const radial = combine(ORIGIN, frame.xAxis, Math.cos(angle), frame.yAxis, Math.sin(angle));
    const tangent = combine(ORIGIN, frame.xAxis, -Math.sin(angle), frame.yAxis, Math.cos(angle));
    const slope = add(span, scale(radial, radiusB - radiusA));
    const surface = normalize(cross(tangent, slope), radial);
    const normal = dot(surface, radial) < 0 ? scale(surface, -1) : surface;
    const indexA = builder.addVertex(add(centerA, scale(radial, radiusA)), normal);
    const indexB = builder.addVertex(add(centerB, scale(radial, radiusB)), normal);

    if (step > 0) {
      builder.addTriangle(previousA, previousB, indexB);
      builder.addTriangle(previousA, indexB, indexA);
    }

    previousA = indexA;
    previousB = indexB;
  }

  addDisc(builder, centerA, frame, radiusA, scale(frame.axis, -1), 0, FULL_TURN);
  addDisc(builder, centerB, frame, radiusB, frame.axis, 0, FULL_TURN);
}

export function addEllipsoidSegment(builder: MeshBuilder, input: EllipsoidInput): void {
  const { center, horizontalRadius, verticalRadius, height } = input;

  if (horizontalRadius <= 0 || verticalRadius <= 0 || height <= 0) return;

  const frame = frameFor(input.normal, null);
  const baseRatio = Math.min(1, Math.max(-1, (verticalRadius - height) / verticalRadius));
  const maxTheta = Math.acos(baseRatio);
  const segments = segmentsFor(FULL_TURN, FULL_CIRCLE_SEGMENTS);
  const rows: number[][] = [];

  for (let ring = 0; ring <= ELLIPSOID_RINGS; ring += 1) {
    const theta = (maxTheta * ring) / ELLIPSOID_RINGS;
    const row: number[] = [];

    for (let step = 0; step < segments; step += 1) {
      const angle = (FULL_TURN * step) / segments;
      const radial = combine(ORIGIN, frame.xAxis, Math.cos(angle), frame.yAxis, Math.sin(angle));

      const position = add(
        add(center, scale(frame.axis, verticalRadius * Math.cos(theta))),
        scale(radial, horizontalRadius * Math.sin(theta)),
      );

      const normal = normalize(
        add(
          scale(radial, Math.sin(theta) / horizontalRadius),
          scale(frame.axis, Math.cos(theta) / verticalRadius),
        ),
        frame.axis,
      );

      row.push(builder.addVertex(position, normal));
    }

    rows.push(row);
  }

  for (let ring = 1; ring < rows.length; ring += 1) {
    for (let step = 0; step < segments; step += 1) {
      const next = (step + 1) % segments;

      builder.addTriangle(rows[ring - 1][step], rows[ring][step], rows[ring][next]);
      builder.addTriangle(rows[ring - 1][step], rows[ring][next], rows[ring - 1][next]);
    }
  }

  const baseRadius = horizontalRadius * Math.sin(maxTheta);

  if (baseRadius > 0) {
    addDisc(
      builder,
      add(center, scale(frame.axis, verticalRadius * baseRatio)),
      frame,
      baseRadius,
      scale(frame.axis, -1),
      0,
      FULL_TURN,
    );
  }
}
