/**
 * The shape the signup charts read. It mirrors the **proposed**
 * `GET /admin/stats/signups` contract in `docs/admin-plan.md` §2b — the backend
 * does not have this endpoint yet, so the types live here rather than in
 * `packages/api/src/admin/types.ts` (which only mirrors what the OpenAPI spec
 * actually declares). Move them there, with a zod schema, the day the endpoint
 * ships.
 */

export const SIGNUP_RANGES = ["week", "month", "year"] as const;
export type SignupRange = (typeof SIGNUP_RANGES)[number];

export type SignupPoint = {
  /** ISO timestamp of the bucket's start. */
  date: string;
  newUsers: number;
  /** How many of `newUsers` have a verified email *now* (not at signup time). */
  verifiedNewUsers: number;
};

export type SignupSeries = {
  range: SignupRange;
  /** `day` for week/month, `month` for year. */
  granularity: "day" | "month";
  points: SignupPoint[];
  total: number;
  /** Total of the immediately preceding period of the same length. */
  previousTotal: number;
};
