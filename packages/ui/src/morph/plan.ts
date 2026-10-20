// Matching and blending: given two shapes, decide which point goes where, then
// interpolate. For each pair of subpaths we solve (closed form, 2D Procrustes)
// the rotation θ and scale σ that best map A onto B, and blend rotation, scale,
// translation and residual shape separately. Two icons that are the same shape
// rotated therefore rotate instead of collapsing through the middle.

import { POINTS, type Shape, type Sub } from "./geometry";

interface Pair {
  /** A, centered on its centroid. */
  a: Float64Array;
  /** B, centered, mapped into A's frame (rotated by -θ, scaled by 1/σ). */
  bt: Float64Array;
  cax: number;
  cay: number;
  cbx: number;
  cby: number;
  theta: number;
  sigma: number;
  out: Sub;
}

export interface Plan {
  /** Blend at progress t (may overshoot [0, 1] with a bouncy spring). Returns the live buffers. */
  at(t: number): Sub[];
  /** The buffers `at` writes into; the driver uses them as the "shape on screen". */
  out: Sub[];
}

/** Residual (relative to A's energy) under which rotation + scale is trusted. */
const MAX_ALIGN_ERROR = 0.12;
const ROTATION_PENALTY = 0.05;
const MIN_SCALE = 0.25;
const MAX_SCALE = 4;

function centroid(p: Float64Array): [number, number] {
  let x = 0;
  let y = 0;
  for (let k = 0; k < POINTS; k++) {
    x += p[2 * k] as number;
    y += p[2 * k + 1] as number;
  }
  return [x / POINTS, y / POINTS];
}

function clone(sub: Sub): Sub {
  return { p: sub.p.slice(), closed: sub.closed };
}

/**
 * Pairs subpaths by nearest centroid. Leftovers on the larger side are paired with a
 * copy of the nearest subpath on the other side, so an extra stroke grows out of (or
 * merges into) an existing one. Collapsing to a single point instead would leave a
 * visible dot, because strokes have round caps.
 */
function pairSubs(from: readonly Sub[], to: readonly Sub[]): Array<[Sub, Sub]> {
  const ca = from.map((s) => centroid(s.p));
  const cb = to.map((s) => centroid(s.p));
  const cands: Array<[number, number, number]> = [];
  for (let i = 0; i < from.length; i++) {
    for (let j = 0; j < to.length; j++) {
      cands.push([Math.hypot((ca[i] as number[])[0]! - (cb[j] as number[])[0]!, (ca[i] as number[])[1]! - (cb[j] as number[])[1]!), i, j]);
    }
  }
  cands.sort((p, q) => p[0] - q[0]);

  const usedA = new Set<number>();
  const usedB = new Set<number>();
  const pairs: Array<[number, number]> = [];
  for (const [, i, j] of cands) {
    if (usedA.has(i) || usedB.has(j)) continue;
    usedA.add(i);
    usedB.add(j);
    pairs.push([i, j]);
  }

  const nearest = (c: [number, number], pool: Array<[number, number]>) => {
    let best = 0;
    let bd = Number.POSITIVE_INFINITY;
    pool.forEach((q, idx) => {
      const dd = Math.hypot(c[0] - q[0], c[1] - q[1]);
      if (dd < bd) {
        bd = dd;
        best = idx;
      }
    });
    return best;
  };

  const out: Array<[Sub, Sub]> = pairs.map(([i, j]) => [from[i] as Sub, to[j] as Sub]);
  for (let i = 0; i < from.length; i++) {
    if (usedA.has(i) || !cb.length) continue;
    out.push([from[i] as Sub, clone(to[nearest(ca[i] as [number, number], cb)] as Sub)]);
  }
  for (let j = 0; j < to.length; j++) {
    if (usedB.has(j) || !ca.length) continue;
    out.push([clone(from[nearest(cb[j] as [number, number], ca)] as Sub), to[j] as Sub]);
  }
  return out;
}

function buildPair(A: Sub, B: Sub): Pair {
  const [cax, cay] = centroid(A.p);
  const [cbx, cby] = centroid(B.p);
  const N = POINTS;
  const bothClosed = A.closed && B.closed;

  const a = new Float64Array(N * 2);
  let aa = 0;
  for (let k = 0; k < N; k++) {
    const x = (A.p[2 * k] as number) - cax;
    const y = (A.p[2 * k + 1] as number) - cay;
    a[2 * k] = x;
    a[2 * k + 1] = y;
    aa += x * x + y * y;
  }
  let bb = 0;
  for (let k = 0; k < N; k++) {
    const x = (B.p[2 * k] as number) - cbx;
    const y = (B.p[2 * k + 1] as number) - cby;
    bb += x * x + y * y;
  }
  const degenerate = aa < 1e-6 || bb < 1e-6;

  // Search both directions and (for closed rings) every starting point.
  const offsets = bothClosed ? N : 1;
  let bestAligned = { score: Number.POSITIVE_INFINITY, err: 1, dir: 1, off: 0, theta: 0, sigma: 1 };
  let bestPlain = { dist: Number.POSITIVE_INFINITY, dir: 1, off: 0 };

  for (const dir of [1, -1]) {
    for (let off = 0; off < offsets; off++) {
      let dot = 0;
      let cross = 0;
      let dist = 0;
      for (let k = 0; k < N; k++) {
        // Closed: rotate the ring by `off`. Open: reversing is just a flip.
        const j = bothClosed ? (((off + dir * k) % N) + N) % N : dir === 1 ? k : N - 1 - k;
        const bx = (B.p[2 * j] as number) - cbx;
        const by = (B.p[2 * j + 1] as number) - cby;
        const ax = a[2 * k] as number;
        const ay = a[2 * k + 1] as number;
        dot += ax * bx + ay * by;
        cross += ax * by - ay * bx;
        const ex = (A.p[2 * k] as number) - (B.p[2 * j] as number);
        const ey = (A.p[2 * k + 1] as number) - (B.p[2 * j + 1] as number);
        dist += ex * ex + ey * ey;
      }
      if (dist < bestPlain.dist) bestPlain = { dist, dir, off };
      if (degenerate) continue;
      const r2 = dot * dot + cross * cross;
      if (r2 < 1e-12) continue;
      const theta = Math.atan2(cross, dot);
      const sigma = Math.sqrt(r2) / aa;
      const err = (bb * aa) / r2 - 1; // residual / |A|², from Cauchy-Schwarz
      const score = err + (ROTATION_PENALTY * Math.abs(theta)) / Math.PI;
      if (score < bestAligned.score) bestAligned = { score, err, dir, off, theta, sigma };
    }
  }

  const useAligned =
    !degenerate &&
    bestAligned.err <= MAX_ALIGN_ERROR &&
    bestAligned.sigma >= MIN_SCALE &&
    bestAligned.sigma <= MAX_SCALE;
  const pick = useAligned ? bestAligned : { ...bestPlain, theta: 0, sigma: 1 };

  const cos = Math.cos(-pick.theta);
  const sin = Math.sin(-pick.theta);
  const bt = new Float64Array(N * 2);
  for (let k = 0; k < N; k++) {
    const j = bothClosed ? (((pick.off + pick.dir * k) % N) + N) % N : pick.dir === 1 ? k : N - 1 - k;
    const bx = (B.p[2 * j] as number) - cbx;
    const by = (B.p[2 * j + 1] as number) - cby;
    bt[2 * k] = (bx * cos - by * sin) / pick.sigma;
    bt[2 * k + 1] = (bx * sin + by * cos) / pick.sigma;
  }

  return {
    a,
    bt,
    cax,
    cay,
    cbx,
    cby,
    theta: pick.theta,
    sigma: pick.sigma,
    out: { p: new Float64Array(N * 2), closed: bothClosed },
  };
}

export function createPlan(from: Shape | readonly Sub[], to: Shape | readonly Sub[]): Plan {
  const fromSubs = Array.isArray(from) ? from : (from as Shape).subs;
  const toSubs = Array.isArray(to) ? to : (to as Shape).subs;
  const pairs = pairSubs(fromSubs as readonly Sub[], toSubs as readonly Sub[]).map(([A, B]) => buildPair(A, B));
  const out = pairs.map((pr) => pr.out);

  return {
    out,
    at(t) {
      for (const pr of pairs) {
        const ang = t * pr.theta;
        const cos = Math.cos(ang);
        const sin = Math.sin(ang);
        const scale = pr.sigma ** t;
        const cx = pr.cax + (pr.cbx - pr.cax) * t;
        const cy = pr.cay + (pr.cby - pr.cay) * t;
        for (let k = 0; k < POINTS; k++) {
          const lx = (1 - t) * (pr.a[2 * k] as number) + t * (pr.bt[2 * k] as number);
          const ly = (1 - t) * (pr.a[2 * k + 1] as number) + t * (pr.bt[2 * k + 1] as number);
          pr.out.p[2 * k] = cx + scale * (lx * cos - ly * sin);
          pr.out.p[2 * k + 1] = cy + scale * (lx * sin + ly * cos);
        }
      }
      return out;
    },
  };
}
