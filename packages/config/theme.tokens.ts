/**
 * The single source of truth for color values shared across web (theme.css)
 * and mobile (NativeWind preset).
 *
 * In accordance with docs/mobile.md §5.7 and docs/theme.md.
 */

export const brandScale = {
  50: '#e9fbff',
  100: '#ccf5ff',
  200: '#a0ecfe',
  300: '#3cdbfa',
  400: '#00b6d2',
  500: '#0097af',
  600: '#00798d',
  700: '#005f6e',
  800: '#004552',
  900: '#002e37',
  950: '#001a20',
} as const

export const neutralScale = {
  50: '#f6fbfc',
  100: '#eaf2f4',
  200: '#d7e2e4',
  300: '#becacd',
  400: '#94a1a4',
  500: '#758386',
  600: '#59686b',
  700: '#425053',
  800: '#2b383b',
  900: '#162326',
  950: '#091416',
} as const

export const blushScale = {
  100: '#ffedf3',
  600: '#7f3b58',
  900: '#562f3f',
} as const

export const semanticLight = {
  background: neutralScale[50],
  foreground: brandScale[900],
  surface: '#ffffff',
  'surface-foreground': brandScale[900],
  field: brandScale[600],
  'field-ink': brandScale[300],
  muted: neutralScale[100],
  'muted-foreground': neutralScale[600],
  highlight: blushScale[100],
  'highlight-foreground': blushScale[600],
  border: neutralScale[200],
  primary: brandScale[600],
  'primary-hover': brandScale[700],
  'primary-foreground': '#ffffff',
  accent: brandScale[700],
  ring: brandScale[400],
  danger: '#b42318',
  success: '#15703a',
  warning: '#a03f07',
} as const

export const semanticDark = {
  background: brandScale[900],
  foreground: neutralScale[50],
  surface: brandScale[800],
  'surface-foreground': neutralScale[50],
  field: brandScale[950],
  'field-ink': brandScale[700],
  muted: brandScale[800],
  'muted-foreground': neutralScale[400],
  highlight: blushScale[900],
  'highlight-foreground': blushScale[100],
  border: brandScale[700],
  primary: brandScale[400],
  'primary-hover': brandScale[300],
  'primary-foreground': brandScale[950],
  accent: brandScale[300],
  ring: brandScale[400],
  danger: '#f97066',
  success: '#4ade80',
  warning: '#f79009',
} as const
