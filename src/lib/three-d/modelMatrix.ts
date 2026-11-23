import { Box3, Euler, Matrix4, Vector3 } from 'three';

import type { ThreeDBox, ThreeDModel, Vector } from '../../types/threeD';

type Placement = Pick<ThreeDModel, 'rotation' | 'scale' | 'translation'> & { unit: string };

const CDF_TO_VIEWER = new Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1);

const METER = 1;
const CENTIMETER = 0.01;
const MILLIMETER = 0.001;
const KILOMETER = 1000;
const FOOT = 0.3048;
const INCH = 0.0254;
const YARD = 0.9144;
const MILE = 1609.34;

const UNIT_FACTORS: ReadonlyMap<string, number> = new Map([
  ['meters', METER],
  ['meter', METER],
  ['m', METER],
  ['centimeters', CENTIMETER],
  ['centimeter', CENTIMETER],
  ['cm', CENTIMETER],
  ['millimeters', MILLIMETER],
  ['millimeter', MILLIMETER],
  ['mm', MILLIMETER],
  ['kilometers', KILOMETER],
  ['kilometer', KILOMETER],
  ['km', KILOMETER],
  ['feet', FOOT],
  ['ft', FOOT],
  ['inches', INCH],
  ['inch', INCH],
  ['yards', YARD],
  ['yard', YARD],
  ['miles', MILE],
  ['mile', MILE],
]);

export function unitFactor(unit: string): number {
  return UNIT_FACTORS.get(unit.toLowerCase()) ?? 1;
}

function fromVector(vector: Vector): Vector3 {
  return new Vector3(vector[0], vector[1], vector[2]);
}

export function computeModelMatrix(placement: Placement): Matrix4 {
  const matrix = new Matrix4();
  const factor = unitFactor(placement.unit);

  if (placement.rotation !== null) {
    matrix.makeRotationFromEuler(
      new Euler(placement.rotation[0], placement.rotation[1], placement.rotation[2]),
    );
  }

  if (placement.scale !== null) {
    const scale = fromVector(placement.scale);

    matrix.multiply(new Matrix4().makeScale(scale.x, scale.y, scale.z));
  }

  if (placement.translation !== null) {
    const translation = fromVector(placement.translation);

    matrix.premultiply(new Matrix4().makeTranslation(translation.x, translation.y, translation.z));
  }

  matrix.premultiply(CDF_TO_VIEWER);
  matrix.premultiply(new Matrix4().makeScale(factor, factor, factor));

  return matrix;
}

export function transformBox(box: ThreeDBox, matrix: Matrix4): Box3 {
  return new Box3(fromVector(box.min), fromVector(box.max)).applyMatrix4(matrix);
}
