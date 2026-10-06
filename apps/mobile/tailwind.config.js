const {
  brandScale,
  neutralScale,
  blushScale,
  semanticLight,
} = require("@noalhub/config/theme.tokens.cjs");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "../../packages/ui-native/src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: brandScale,
        neutral: neutralScale,
        blush: blushScale,
        background: semanticLight.background,
        foreground: semanticLight.foreground,
        surface: semanticLight.surface,
        "surface-foreground": semanticLight["surface-foreground"],
        muted: semanticLight.muted,
        "muted-foreground": semanticLight["muted-foreground"],
        highlight: semanticLight.highlight,
        "highlight-foreground": semanticLight["highlight-foreground"],
        border: semanticLight.border,
        primary: {
          DEFAULT: semanticLight.primary,
          hover: semanticLight["primary-hover"],
          foreground: semanticLight["primary-foreground"],
        },
        accent: semanticLight.accent,
        ring: semanticLight.ring,
        danger: semanticLight.danger,
        success: semanticLight.success,
        warning: semanticLight.warning,
      },
    },
  },
  plugins: [],
};
