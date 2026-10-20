// Geometry for the icon morph: turns SVG shapes into fixed-size point rings.
//
// Pipeline: SVG markup / IconNode / `d` string -> one path `d` -> dense polylines
// (curves and arcs flattened) -> N points evenly spaced by arc length. Point i of
// one icon then maps to point i of another, which is what makes interpolation
// trivial. Stroke-only: fills are ignored.

/** Points per subpath. Enough to look smooth at icon sizes. */
export const POINTS = 96;

export interface Sub {
  /** Flat [x0, y0, x1, y1, …], length POINTS * 2. */
  p: Float64Array;
  closed: boolean;
}

export interface Shape {
  /** The exact path data, written to the DOM once the morph settles. */
  d: string;
  subs: Sub[];
}

interface Poly {
  pts: number[];
  closed: boolean;
}

/** Lucide's IconNode format: [tag, attributes][]. */
export type IconNode = ReadonlyArray<readonly [string, Readonly<Record<string, string | number>>]>;

/* ---------------------------------------------------------------------------
 * SVG shapes -> path data
 * ------------------------------------------------------------------------- */

const f = (v: unknown, fallback = 0) => {
  const n = Number.parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : fallback;
};

function ellipseD(cx: number, cy: number, rx: number, ry: number) {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
}

function rectD(x: number, y: number, w: number, h: number, rxIn: number, ryIn: number) {
  const rx = Math.min(rxIn || ryIn, w / 2);
  const ry = Math.min(ryIn || rxIn, h / 2);
  if (!rx && !ry) return `M${x} ${y}h${w}v${h}h${-w}Z`;
  return (
    `M${x + rx} ${y}h${w - 2 * rx}a${rx} ${ry} 0 0 1 ${rx} ${ry}v${h - 2 * ry}` +
    `a${rx} ${ry} 0 0 1 ${-rx} ${ry}h${-(w - 2 * rx)}a${rx} ${ry} 0 0 1 ${-rx} ${-ry}` +
    `v${-(h - 2 * ry)}a${rx} ${ry} 0 0 1 ${rx} ${-ry}Z`
  );
}

function pointsD(points: string, close: boolean) {
  const nums = points.trim().split(/[\s,]+/).map(Number);
  let d = "";
  for (let i = 0; i + 1 < nums.length; i += 2) d += `${i ? "L" : "M"}${nums[i]} ${nums[i + 1]}`;
  return d && close ? `${d}Z` : d;
}

function shapeToD(tag: string, a: Readonly<Record<string, string | number>>): string {
  switch (tag) {
    case "path":
      return String(a.d ?? "");
    case "line":
      return `M${f(a.x1)} ${f(a.y1)}L${f(a.x2)} ${f(a.y2)}`;
    case "polyline":
      return pointsD(String(a.points ?? ""), false);
    case "polygon":
      return pointsD(String(a.points ?? ""), true);
    case "circle":
      return ellipseD(f(a.cx), f(a.cy), f(a.r), f(a.r));
    case "ellipse":
      return ellipseD(f(a.cx), f(a.cy), f(a.rx), f(a.ry));
    case "rect":
      return rectD(f(a.x), f(a.y), f(a.width), f(a.height), f(a.rx), f(a.ry));
    default:
      return "";
  }
}

export function iconNodeToD(node: IconNode): string {
  return node.map(([tag, attrs]) => shapeToD(tag, attrs)).join("");
}

/** SVG markup (e.g. an Iconify `body`) to path data. Transforms and `<g>` styling are ignored. */
export function svgBodyToD(body: string): string {
  const out: string[] = [];
  for (const m of body.matchAll(/<(path|line|polyline|polygon|circle|ellipse|rect)\b([^>]*?)\/?>/g)) {
    const attrs: Record<string, string> = {};
    for (const a of (m[2] ?? "").matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)) attrs[a[1] as string] = a[2] as string;
    out.push(shapeToD(m[1] as string, attrs));
  }
  return out.join("");
}

/* ---------------------------------------------------------------------------
 * Path data -> dense polylines
 * ------------------------------------------------------------------------- */

const NUM = /[-+]?(?:\d*\.\d+|\d+\.?)(?:e[-+]?\d+)?/y;

type Push = (x: number, y: number) => void;

function arc(
  x1: number,
  y1: number,
  rxIn: number,
  ryIn: number,
  phiDeg: number,
  fa: number,
  fs: number,
  x2: number,
  y2: number,
  push: Push,
) {
  let rx = Math.abs(rxIn);
  let ry = Math.abs(ryIn);
  if (!rx || !ry) return push(x2, y2);
  if (x1 === x2 && y1 === y2) return;

  // SVG spec F.6.5: endpoint -> center parametrization.
  const phi = (phiDeg * Math.PI) / 180;
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cp * dx + sp * dy;
  const y1p = -sp * dx + cp * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const co = (fa === fs ? -1 : 1) * Math.sqrt(Math.max(0, num / den));
  const cxp = (co * rx * y1p) / ry;
  const cyp = (-co * ry * x1p) / rx;
  const cx = cp * cxp - sp * cyp + (x1 + x2) / 2;
  const cy = sp * cxp + cp * cyp + (y1 + y2) / 2;

  const ang = (ux: number, uy: number, vx: number, vy: number) =>
    Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!fs && dth > 0) dth -= 2 * Math.PI;
  else if (fs && dth < 0) dth += 2 * Math.PI;

  const steps = Math.max(2, Math.ceil(Math.abs(dth) / (Math.PI / 24)));
  for (let i = 1; i <= steps; i++) {
    const th = th1 + (dth * i) / steps;
    const ct = Math.cos(th);
    const st = Math.sin(th);
    push(cp * rx * ct - sp * ry * st + cx, sp * rx * ct + cp * ry * st + cy);
  }
}

export function flattenPath(d: string): Poly[] {
  const polys: Poly[] = [];
  const n = d.length;
  let i = 0;

  const skip = () => {
    while (i < n && (d.charCodeAt(i) <= 32 || d[i] === ",")) i++;
  };
  const num = (): number => {
    skip();
    NUM.lastIndex = i;
    const m = NUM.exec(d);
    if (!m) return Number.NaN;
    i = NUM.lastIndex;
    return Number.parseFloat(m[0]);
  };
  // Arc flags may be glued to the next number ("011"), so they are a single char.
  const flag = (): number => {
    skip();
    const c = d[i];
    if (c !== "0" && c !== "1") return Number.NaN;
    i++;
    return c === "1" ? 1 : 0;
  };

  let cmd = "";
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cur: Poly | null = null;
  let ctrlX = 0; // last cubic/quad control point, for S/T reflection
  let ctrlY = 0;
  let prev = "";

  const start = (): Poly => {
    if (!cur) {
      cur = { pts: [x, y], closed: false };
      polys.push(cur);
    }
    return cur;
  };
  const push: Push = (px, py) => {
    start().pts.push(px, py);
    x = px;
    y = py;
  };

  for (;;) {
    skip();
    if (i >= n) break;
    const ch = d[i] as string;
    if (/[a-zA-Z]/.test(ch)) {
      cmd = ch;
      i++;
      if (cmd === "z" || cmd === "Z") {
        if (cur) (cur as Poly).closed = true;
        cur = null;
        x = sx;
        y = sy;
        prev = "z";
        continue;
      }
    } else if (!cmd || cmd === "z" || cmd === "Z") {
      break;
    }

    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    const lower = cmd.toLowerCase();
    let ok = true;

    if (lower === "m") {
      const nx = num() + ox;
      const ny = num() + oy;
      if (Number.isNaN(nx + ny)) break;
      x = nx;
      y = ny;
      sx = x;
      sy = y;
      cur = null;
      cmd = rel ? "l" : "L"; // extra pairs after M are implicit lineto
    } else if (lower === "l") {
      const nx = num() + ox;
      const ny = num() + oy;
      ok = !Number.isNaN(nx + ny);
      if (ok) push(nx, ny);
    } else if (lower === "h") {
      const nx = num() + ox;
      ok = !Number.isNaN(nx);
      if (ok) push(nx, y);
    } else if (lower === "v") {
      const ny = num() + oy;
      ok = !Number.isNaN(ny);
      if (ok) push(x, ny);
    } else if (lower === "c" || lower === "s") {
      let x1: number;
      let y1: number;
      if (lower === "c") {
        x1 = num() + ox;
        y1 = num() + oy;
      } else {
        const reflect = prev === "c" || prev === "s";
        x1 = reflect ? 2 * x - ctrlX : x;
        y1 = reflect ? 2 * y - ctrlY : y;
      }
      const x2 = num() + ox;
      const y2 = num() + oy;
      const x3 = num() + ox;
      const y3 = num() + oy;
      ok = !Number.isNaN(x1 + y1 + x2 + y2 + x3 + y3);
      if (ok) {
        const x0 = x;
        const y0 = y;
        for (let k = 1; k <= 24; k++) {
          const t = k / 24;
          const u = 1 - t;
          push(
            u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3,
            u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3,
          );
        }
        ctrlX = x2;
        ctrlY = y2;
      }
    } else if (lower === "q" || lower === "t") {
      let x1: number;
      let y1: number;
      if (lower === "q") {
        x1 = num() + ox;
        y1 = num() + oy;
      } else {
        const reflect = prev === "q" || prev === "t";
        x1 = reflect ? 2 * x - ctrlX : x;
        y1 = reflect ? 2 * y - ctrlY : y;
      }
      const x2 = num() + ox;
      const y2 = num() + oy;
      ok = !Number.isNaN(x1 + y1 + x2 + y2);
      if (ok) {
        const x0 = x;
        const y0 = y;
        for (let k = 1; k <= 16; k++) {
          const t = k / 16;
          const u = 1 - t;
          push(u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2);
        }
        ctrlX = x1;
        ctrlY = y1;
      }
    } else if (lower === "a") {
      const rx = num();
      const ry = num();
      const rot = num();
      const fa = flag();
      const fs = flag();
      const nx = num() + ox;
      const ny = num() + oy;
      ok = !Number.isNaN(rx + ry + rot + fa + fs + nx + ny);
      if (ok) {
        start();
        arc(x, y, rx, ry, rot, fa, fs, nx, ny, push);
      }
    } else {
      break; // unknown command
    }

    if (!ok) break;
    prev = lower;
  }

  // A lone moveto draws nothing.
  return polys.filter((p) => p.pts.length >= 4);
}

/* ---------------------------------------------------------------------------
 * Polylines -> fixed-size point rings
 * ------------------------------------------------------------------------- */

function resample(poly: Poly): Float64Array {
  const src = poly.pts.slice();
  if (poly.closed) src.push(src[0] as number, src[1] as number);
  const m = src.length / 2;
  const cum = new Float64Array(m);
  for (let k = 1; k < m; k++) {
    cum[k] =
      (cum[k - 1] as number) +
      Math.hypot((src[2 * k] as number) - (src[2 * k - 2] as number), (src[2 * k + 1] as number) - (src[2 * k - 1] as number));
  }
  const total = cum[m - 1] as number;
  const out = new Float64Array(POINTS * 2);
  let seg = 1;
  for (let k = 0; k < POINTS; k++) {
    const target = total * (poly.closed ? k / POINTS : k / (POINTS - 1));
    while (seg < m - 1 && (cum[seg] as number) < target) seg++;
    const c0 = cum[seg - 1] as number;
    const len = (cum[seg] as number) - c0;
    const t = len > 1e-9 ? (target - c0) / len : 0;
    const ax = src[2 * seg - 2] as number;
    const ay = src[2 * seg - 1] as number;
    out[2 * k] = ax + ((src[2 * seg] as number) - ax) * t;
    out[2 * k + 1] = ay + ((src[2 * seg + 1] as number) - ay) * t;
  }
  return out;
}

export function toShape(d: string): Shape {
  return { d, subs: flattenPath(d).map((poly) => ({ p: resample(poly), closed: poly.closed })) };
}

/** Points back to path data (used for in-flight frames). */
export function subsToD(subs: readonly Sub[]): string {
  let d = "";
  for (const { p, closed } of subs) {
    for (let k = 0; k < POINTS; k++) {
      d += `${k ? "L" : "M"}${(p[2 * k] as number).toFixed(2)} ${(p[2 * k + 1] as number).toFixed(2)}`;
    }
    if (closed) d += "Z";
  }
  return d;
}
