// Semantic design tokens (ADR 0007). Screens use semantic names only, never raw hex.
// Brand palette from assets/brand/README.md: navy #1E1B3A, orange #FF8A4C, mint #3CCB9E.
export const palette = { navy: '#1E1B3A', orange: '#FF8A4C', mint: '#3CCB9E', white: '#FFFFFF' } as const;

export interface Theme {
  bg: string; surface: string; text: string; textMuted: string;
  accent: string; onAccent: string; success: string; border: string;
}

export const light: Theme = {
  bg: '#FFFFFF', surface: '#F6F4FA', text: palette.navy, textMuted: '#5B5878',
  accent: '#C2410C', onAccent: '#FFFFFF', success: '#0F7B5C', border: '#E3E0EE',
};
export const dark: Theme = {
  bg: '#14122A', surface: '#1E1B3A', text: '#F4F2FB', textMuted: '#B9B5D3',
  accent: palette.orange, onAccent: '#1E1B3A', success: palette.mint, border: '#34305A',
};
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
export const radius = { sm: 8, md: 14, lg: 24 } as const;
export const minTouch = 44;

// WCAG contrast helper used by the contrast test.
const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};
