import { describe, expect, it } from 'vitest';
import { contrast, dark, light } from './index';

describe('contrast (WCAG AA)', () => {
  for (const [name, t] of [['light', light], ['dark', dark]] as const) {
    it(`${name}: text on bg and surface, accent button`, () => {
      expect(contrast(t.text, t.bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.textMuted, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onAccent, t.accent)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onHero, t.hero)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onHeroMuted, t.hero)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onHighlight, t.highlight)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.onDone, t.done)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
