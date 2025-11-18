// LMN8 Design System v1.0
// Single Source of Truth for Product, Design & Development

export const LMN8Colors = {
  // Color Palette: "Deep Blue Sea"
  bgDark: '#0b132b',           // Background foundation
  container: '#1c2541',         // Cards/Modals
  bgLight: '#2a3a5a',          // Light background for cards
  uiSecondary: '#3a506b',      // Secondary UI, borders
  accentPrimary: '#5bc0be',    // Primary actions, CTAs
  accentSecondary: '#4a90e2',  // Secondary actions
  accentHighlight: '#6fffe9',  // Hover/active states
  text100: '#ffffff',          // Headings (100% white)
  text85: 'rgba(255, 255, 255, 0.85)',  // Body text
  text60: 'rgba(255, 255, 255, 0.6)',   // Metadata/labels
  error: '#ff6b6b',            // Error states
  shadow: '#000000',           // Shadow color
  
  // Light Mode Colors
  lightBg: '#f8f9fb',          // Light background
  lightSurface: '#ffffff',      // Light surface
  lightText: '#0b132b',        // Light mode primary text
  lightSecondaryText: '#3a506b', // Light mode secondary text
  lightBorder: '#e5e9f0',      // Light mode borders
} as const;

export const LMN8Typography = {
  // Typography Scale - Using system fonts for now
  h1: {
    fontFamily: 'System',
    fontSize: 40, // 2.5rem
    fontWeight: '700',
    lineHeight: 52, // 1.3
    color: LMN8Colors.text100,
  },
  h2: {
    fontFamily: 'System',
    fontSize: 32, // 2rem
    fontWeight: '600',
    lineHeight: 43, // 1.35
    color: LMN8Colors.text100,
  },
  h3: {
    fontFamily: 'System',
    fontSize: 24, // 1.5rem
    fontWeight: '600',
    lineHeight: 34, // 1.4
    color: LMN8Colors.text100,
  },
  body: {
    fontFamily: 'System',
    fontSize: 16, // 1rem
    fontWeight: '400',
    lineHeight: 26, // 1.6
    color: LMN8Colors.text85,
  },
  label: {
    fontFamily: 'System',
    fontSize: 14, // 0.85rem
    fontWeight: '600',
    lineHeight: 20, // 1.4
    color: LMN8Colors.text60,
    textTransform: 'uppercase' as const,
  },
  metadata: {
    fontFamily: 'System',
    fontSize: 12, // 0.75rem
    fontWeight: '400',
    lineHeight: 17, // 1.4
    color: LMN8Colors.text60,
  },
  caption: {
    fontFamily: 'System',
    fontSize: 10, // 0.625rem
    fontWeight: '400',
    lineHeight: 14, // 1.4
    color: LMN8Colors.text60,
  },
} as const;

export const LMN8Spacing = {
  xs: 4,    // 4px
  sm: 8,    // 8px
  md: 12,   // 12px
  lg: 16,   // 16px
  xl: 20,   // 20px
  xxl: 24,  // 24px
  full: 9999, // Full width/height
} as const;

export const LMN8BorderRadius = {
  sm: 4,    // 4px
  md: 8,    // 8px
  lg: 12,   // 12px
  xl: 16,   // 16px
  xxl: 24,  // 24px
  full: 9999, // Full rounded
} as const;

export const LMN8Animation = {
  // Motion & Animation
  buttonHover: '200ms ease-out',
  pageTransition: '400ms cubic-bezier(0.4,0,0.2,1)',
  elementAppearance: '300ms ease-in-out',
  loadingState: 'infinite ease-in-out',
} as const;

export const LMN8Breakpoints = {
  mobileSmall: 360,
  mobileLarge: 640,
  tablet: 768,
  desktop: 1024,
} as const;

export const LMN8TouchTargets = {
  minSize: 44, // 44px minimum touch target
  spacing: 8,  // 8px spacing between touch targets
} as const;
