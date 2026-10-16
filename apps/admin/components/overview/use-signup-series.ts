"use client";

import { useMemo } from "react";

import type { SignupPoint, SignupRange, SignupSeries } from "./signup-series";

const DAY_MS = 24 * 60 * 60 * 1000;

/** A deterministic pseudo-random in [0, 1): the same input always draws the same chart. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function build(range: SignupRange, offset: number): { points: SignupPoint[]; total: number } {
  const monthly = range === "year";
  const count = range === "week" ? 7 : range === "month" ? 30 : 12;
  const now = new Date();
  const points: SignupPoint[] = [];

  for (let i = count - 1; i >= 0; i--) {
    const index = i + offset * count;
    const date = monthly
      ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1))
      : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - index * DAY_MS);

    // A slow upward trend plus noise, scaled so daily and monthly buckets read alike.
    const scale = monthly ? 30 : 1;
    const trend = 1 + (count - i) / count;
    const newUsers = Math.round((6 + noise(index + 1) * 14) * scale * trend * 0.6);
    const verifiedNewUsers = Math.round(newUsers * (0.65 + noise(index + 99) * 0.25));
    points.push({ date: date.toISOString(), newUsers, verifiedNewUsers });
  }

  return { points, total: points.reduce((sum, p) => sum + p.newUsers, 0) };
}

/**
 * **Sample data**, not a query. It exists so the charts and the week/month/year
 * filter can be built and reviewed before the backend has an endpoint for them
 * (`docs/admin-plan.md` §2b).
 *
 * The return shape matches what a real `useQuery` hands back for the fields the
 * charts read, so swapping this for `useAdminSignupSeries(range)` from
 * `@noalhub/api/admin` is a one-line change in `signups-section.tsx`. Do not
 * import this from anywhere else: the numbers are invented.
 */
export function useSampleSignupSeries(range: SignupRange): {
  data: SignupSeries;
  isPending: false;
  isError: false;
} {
  const data = useMemo<SignupSeries>(() => {
    const current = build(range, 0);
    const previous = build(range, 1);
    return {
      range,
      granularity: range === "year" ? "month" : "day",
      points: current.points,
      total: current.total,
      previousTotal: previous.total,
    };
  }, [range]);

  return { data, isPending: false, isError: false };
}
