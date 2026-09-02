/**
 * Shared import boundaries for the whole monorepo.
 *
 * The goal is not "tidy code" but keeping a future REPO SPLIT cheap
 * (docs/monorepo.md §4): as long as `apps/web` and `apps/admin` import each
 * other, or `packages/*` reaches back up into `apps/*`, `git filter-repo`
 * will produce a repo that does not build.
 */
export const boundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@noalhub/api/src/*", "@noalhub/*/src/*"],
          message:
            "Import through the package's public barrel (e.g. `@noalhub/api/auth`); do not reach into `src/`.",
        },
        {
          group: ["**/apps/*"],
          message:
            "packages/* must not depend on apps/*. Shared code belongs down in packages/.",
        },
      ],
    },
  ],
};
