import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { HOLIDAY_CAMPAIGNS } from '../config/promotions.config';

describe('Frontend Theme & Promotions Engine Catalog', () => {
  it('should have exactly 12 seasonal campaigns configured', () => {
    expect(HOLIDAY_CAMPAIGNS.length).toBe(12);
    const ids = HOLIDAY_CAMPAIGNS.map(c => c.id);
    expect(ids).toContain('default');
    expect(ids).toContain('new_year');
    expect(ids).toContain('valentines');
    expect(ids).toContain('st_patricks');
    expect(ids).toContain('spring_easter');
    expect(ids).toContain('memorial_day');
    expect(ids).toContain('july4');
    expect(ids).toContain('labor_day');
    expect(ids).toContain('halloween');
    expect(ids).toContain('thanksgiving');
    expect(ids).toContain('black_friday');
    expect(ids).toContain('christmas_winter');
  });

  it('every theme should define exactly 3 primary visual colors and 3 phoenix colors', () => {
    HOLIDAY_CAMPAIGNS.forEach(campaign => {
      const theme = campaign.theme;
      expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.tertiary).toMatch(/^#[0-9a-fA-F]{6}$/);

      expect(theme.phoenixColors.bird1).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.phoenixColors.bird2).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.phoenixColors.bird3).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it('default theme preserves signature Phoenix Websites AI colors', () => {
    const defaultTheme = HOLIDAY_CAMPAIGNS.find(c => c.id === 'default')?.theme;
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme?.colors.primary).toBe('#ff4d00');   // Fire Orange
    expect(defaultTheme?.colors.secondary).toBe('#00d2ff'); // Ice Cyan
    expect(defaultTheme?.colors.tertiary).toBe('#a855f7');  // Eclipse Purple
  });

  it('halloween theme defines pumpkin orange, wicked purple, and slime green', () => {
    const halloween = HOLIDAY_CAMPAIGNS.find(c => c.id === 'halloween');
    expect(halloween).toBeDefined();
    expect(halloween?.theme.colors.primary).toBe('#ff5500');
    expect(halloween?.theme.colors.secondary).toBe('#9333ea');
    expect(halloween?.theme.colors.tertiary).toBe('#10b981');
    expect(halloween?.discountPercent).toBe(35); // 35% market-researched discount
  });

  it('christmas theme defines holiday crimson, pine green, and gold', () => {
    const christmas = HOLIDAY_CAMPAIGNS.find(c => c.id === 'christmas_winter')?.theme;
    expect(christmas).toBeDefined();
    expect(christmas?.colors.primary).toBe('#dc2626');
    expect(christmas?.colors.secondary).toBe('#16a34a');
    expect(christmas?.colors.tertiary).toBe('#fbbf24');
  });

  it('every theme should define exactly 3 distinct phoenix names and colors', () => {
    HOLIDAY_CAMPAIGNS.forEach(campaign => {
      const p = campaign.theme.phoenixes;
      expect(p).toBeDefined();
      expect(p.phoenix1.name.length).toBeGreaterThan(0);
      expect(p.phoenix2.name.length).toBeGreaterThan(0);
      expect(p.phoenix3.name.length).toBeGreaterThan(0);
      expect(p.phoenix1.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(p.phoenix2.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(p.phoenix3.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      // Bird names should be unique within each theme
      expect(p.phoenix1.name).not.toBe(p.phoenix2.name);
      expect(p.phoenix2.name).not.toBe(p.phoenix3.name);
    });
  });

  it('verifies specific theme names for Halloween and Christmas', () => {
    const halloween = HOLIDAY_CAMPAIGNS.find(c => c.id === 'halloween')?.theme.phoenixes;
    expect(halloween?.phoenix1.name).toBe('Ember Phoenix');
    expect(halloween?.phoenix2.name).toBe('Specter Phoenix');
    expect(halloween?.phoenix3.name).toBe('Venom Phoenix');

    const christmas = HOLIDAY_CAMPAIGNS.find(c => c.id === 'christmas_winter')?.theme.phoenixes;
    expect(christmas?.phoenix1.name).toBe('Holly Phoenix');
    expect(christmas?.phoenix2.name).toBe('Frost Phoenix');
    expect(christmas?.phoenix3.name).toBe('Solstice Phoenix');
  });
});


