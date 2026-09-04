// Storybook loads plain CSS through its own builder; TypeScript only needs to
// know the side-effect import resolves.
declare module "*.css";
