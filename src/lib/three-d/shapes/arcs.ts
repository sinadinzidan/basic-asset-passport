import { FULL_TURN, FULL_TURN_TOLERANCE, MIN_ARC_SEGMENTS } from '../../../constants/threeD';

export function resolveArc(arcAngle: number): number {
  return !Number.isFinite(arcAngle) || arcAngle <= 0 || arcAngle >= FULL_TURN - FULL_TURN_TOLERANCE
    ? FULL_TURN
    : arcAngle;
}

export function isFullTurn(arc: number): boolean {
  return arc >= FULL_TURN - FULL_TURN_TOLERANCE;
}

export function segmentsFor(arc: number, segmentsPerTurn: number): number {
  return Math.max(MIN_ARC_SEGMENTS, Math.ceil((arc / FULL_TURN) * segmentsPerTurn));
}
