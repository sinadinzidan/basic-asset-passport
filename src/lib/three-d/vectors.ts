import type { Vector } from '../../types/threeD';

const NEARLY_ZERO = 1e-12;

const UNIT_X: Vector = [1, 0, 0];
const UNIT_Y: Vector = [0, 1, 0];
const UNIT_Z: Vector = [0, 0, 1];

export const UNIT_AXES: readonly Vector[] = [UNIT_X, UNIT_Y, UNIT_Z];

const ROW_X = 0;
const ROW_Y = 1;
const ROW_Z = 2;

const COLUMN_X = 0;
const COLUMN_Y = 4;
const COLUMN_Z = 8;
const COLUMN_TRANSLATION = 12;

export function add(first: Vector, second: Vector): Vector {
  return [first[0] + second[0], first[1] + second[1], first[2] + second[2]];
}

export function subtract(first: Vector, second: Vector): Vector {
  return [first[0] - second[0], first[1] - second[1], first[2] - second[2]];
}

export function scale(vector: Vector, factor: number): Vector {
  return [vector[0] * factor, vector[1] * factor, vector[2] * factor];
}

export function dot(first: Vector, second: Vector): number {
  return first[0] * second[0] + first[1] * second[1] + first[2] * second[2];
}

export function cross(first: Vector, second: Vector): Vector {
  return [
    first[1] * second[2] - first[2] * second[1],
    first[2] * second[0] - first[0] * second[2],
    first[0] * second[1] - first[1] * second[0],
  ];
}

export function length(vector: Vector): number {
  return Math.sqrt(dot(vector, vector));
}

export function normalize(vector: Vector, fallback: Vector = UNIT_Z): Vector {
  const size = length(vector);

  return size > NEARLY_ZERO ? scale(vector, 1 / size) : fallback;
}

export function perpendicularTo(axis: Vector): Vector {
  const reference = Math.abs(axis[0]) < Math.abs(axis[1]) ? UNIT_X : UNIT_Y;

  return normalize(cross(axis, reference));
}

export function combine(
  origin: Vector,
  firstAxis: Vector,
  firstFactor: number,
  secondAxis: Vector,
  secondFactor: number,
): Vector {
  return add(origin, add(scale(firstAxis, firstFactor), scale(secondAxis, secondFactor)));
}

function applyRow(matrix: ArrayLike<number>, row: number, vector: Vector): number {
  return (
    matrix[COLUMN_X + row] * vector[0] +
    matrix[COLUMN_Y + row] * vector[1] +
    matrix[COLUMN_Z + row] * vector[2]
  );
}

export function transformPoint(matrix: ArrayLike<number>, point: Vector): Vector {
  return [
    applyRow(matrix, ROW_X, point) + matrix[COLUMN_TRANSLATION + ROW_X],
    applyRow(matrix, ROW_Y, point) + matrix[COLUMN_TRANSLATION + ROW_Y],
    applyRow(matrix, ROW_Z, point) + matrix[COLUMN_TRANSLATION + ROW_Z],
  ];
}

export function transformDirection(matrix: ArrayLike<number>, direction: Vector): Vector {
  return [
    applyRow(matrix, ROW_X, direction),
    applyRow(matrix, ROW_Y, direction),
    applyRow(matrix, ROW_Z, direction),
  ];
}
