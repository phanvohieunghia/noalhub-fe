/**
 * Ranh giới import dùng chung cho cả monorepo.
 *
 * Mục tiêu không phải "cho code đẹp" mà là giữ cho bước TÁCH REPO trong tương
 * lai còn rẻ (docs/monorepo-plan.md §4): ngày nào `apps/web` và `apps/admin`
 * còn import chéo nhau, hoặc `packages/*` còn với ngược lên `apps/*`, thì
 * `git filter-repo` sẽ cho ra một repo không build được.
 */
export const boundaryRules = {
  "no-restricted-imports": [
    "error",
    {
      patterns: [
        {
          group: ["@noalhub/api/src/*", "@noalhub/*/src/*"],
          message:
            "Import qua barrel công khai của package (vd `@noalhub/api/auth`), đừng chọc thẳng vào `src/`.",
        },
        {
          group: ["**/apps/*"],
          message:
            "packages/* không được phụ thuộc vào apps/*. Cần dùng chung thì đẩy code xuống packages/.",
        },
      ],
    },
  ],
};
