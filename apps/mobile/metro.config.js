const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Allow hierarchical lookup for pnpm symlinked virtual store
// config.resolver.disableHierarchicalLookup = false;

// 4. Enable package exports (e.g. for @noalhub/api/*)
config.resolver.unstable_enablePackageExports = true;

// 5. Singletons. pnpm gives `packages/ui-native` its own copy of these (a
// different peer-dependency hash). For NativeWind, styles compiled into the app's
// copy are invisible to a component importing the other one — every `className`
// inside ui-native renders unstyled; a second react-native-svg registers its
// native views twice. Resolve them all from the app.
const SINGLETONS = ["nativewind", "react-native-css-interop", "react-native-svg"];
const appOrigin = path.join(projectRoot, "package.json");
const upstreamResolve = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const isSingleton = SINGLETONS.some(
    (name) => moduleName === name || moduleName.startsWith(`${name}/`),
  );
  const ctx = isSingleton ? { ...context, originModulePath: appOrigin } : context;
  return (upstreamResolve ?? context.resolveRequest)(ctx, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
