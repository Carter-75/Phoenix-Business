import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { BASE_PROJECTS, FEATURE_ADDONS } from './pricing.service';

describe('Pricing Catalog and Rules', () => {
  it('should have all 5 base tiers defined in the unified system', () => {
    expect(BASE_PROJECTS.length).toBe(5);
    const ids = BASE_PROJECTS.map(p => p.id);
    expect(ids).toContain('starter');
    expect(ids).toContain('business');
    expect(ids).toContain('ecommerce');
    expect(ids).toContain('webapp');
    expect(ids).toContain('enterprise');
  });

  it('starter tier should have both setup fee and monthly fee', () => {
    const starter = BASE_PROJECTS.find(p => p.id === 'starter');
    expect(starter).toBeDefined();
    expect(starter?.baseSetupPrice).toBe(149900); // $1,499 setup
    expect(starter?.baseMonthlyPrice).toBe(9900); // $99/mo
    expect(starter?.pagesIncluded).toBe(3);
  });

  it('ecommerce tier should inherently include payment processing', () => {
    const ecommerce = BASE_PROJECTS.find(p => p.id === 'ecommerce');
    expect(ecommerce).toBeDefined();
    expect(ecommerce?.inherentFeatures).toContain('payments');
    expect(ecommerce?.baseSetupPrice).toBe(349900);
    expect(ecommerce?.baseMonthlyPrice).toBe(29900);
  });

  it('webapp tier should inherently include auth and database', () => {
    const webapp = BASE_PROJECTS.find(p => p.id === 'webapp');
    expect(webapp).toBeDefined();
    expect(webapp?.inherentFeatures).toContain('auth');
    expect(webapp?.inherentFeatures).toContain('database');
  });

  it('should have feature addons with explicit billing classifications (ONE_TIME, MONTHLY, BOTH)', () => {
    const roles = FEATURE_ADDONS.find(f => f.id === 'roles');
    expect(roles?.billingType).toBe('ONE_TIME');

    const prioritySla = FEATURE_ADDONS.find(f => f.id === 'priority_sla');
    expect(prioritySla?.billingType).toBe('MONTHLY');

    const aiAssistant = FEATURE_ADDONS.find(f => f.id === 'ai_assistant');
    expect(aiAssistant?.billingType).toBe('BOTH');
  });

  it('should have dependency requirements for advanced feature addons', () => {
    const dashboard = FEATURE_ADDONS.find(f => f.id === 'dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard?.requires).toContain('auth');
    expect(dashboard?.requires).toContain('database');
  });

  it('should define mutually exclusive support add-ons with group support-duration', () => {
    const supportAddons = FEATURE_ADDONS.filter(f => f.group === 'support-duration');
    expect(supportAddons.length).toBe(3);

    const s6 = supportAddons.find(s => s.id === 'support_6mo');
    const s12 = supportAddons.find(s => s.id === 'support_12mo');
    const s24 = supportAddons.find(s => s.id === 'support_24mo');

    expect(s6).toBeDefined();
    expect(s12).toBeDefined();
    expect(s24).toBeDefined();

    expect(s6?.monthlyPrice).toBe(8900); // $89/mo
    expect(s12?.monthlyPrice).toBe(6900); // $69/mo
    expect(s24?.monthlyPrice).toBe(4900); // $49/mo

    expect(s6?.durationMonths).toBe(6);
    expect(s12?.durationMonths).toBe(12);
    expect(s24?.durationMonths).toBe(24);

    expect(s6?.inclusions?.length).toBeGreaterThan(0);
    expect(s6?.exclusions?.length).toBeGreaterThan(0);
  });
});

