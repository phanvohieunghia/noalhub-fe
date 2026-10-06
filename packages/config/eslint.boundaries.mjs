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

export const mobileBoundaryRules = {
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
            "apps/mobile must not depend on other apps/*. Shared code belongs down in packages/.",
        },
        {
          group: ["@noalhub/ui", "@noalhub/ui/*"],
          message:
            "packages/ui is web-only (DOM/Radix). Use packages/ui-native for mobile.",
        },
        {
          group: ["next", "next/*", "next-intl", "next-intl/*"],
          message:
            "Next.js and next-intl are web-only. Mobile uses Expo Router and use-intl.",
        },
      ],
    },
  ],
};
