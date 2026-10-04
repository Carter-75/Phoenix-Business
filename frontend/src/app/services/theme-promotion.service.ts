import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ApiService } from './api.service';
import { 
  HOLIDAY_CAMPAIGNS, 
  HolidayCampaign, 
  ThemeConfig, 
  PhoenixColors,
  BUSINESS_TIMEZONE 
} from '../config/promotions.config';

@Injectable({
  providedIn: 'root'
})
export class ThemePromotionService {
  private api = inject(ApiService);
  private readonly STORAGE_MODE_KEY = 'phoenix_theme_mode';
  private readonly STORAGE_MANUAL_THEME_KEY = 'phoenix_manual_theme';

  // Catalog
  public readonly campaigns = HOLIDAY_CAMPAIGNS;

  // State
  public mode = signal<'auto' | 'manual'>('auto');
  public manualThemeId = signal<string>('default');
  public autoThemeId = signal<string>('default');
  
  // Authoritative promotion details (from backend)
  public serverPromotion = signal<any>(null);

  // Active theme based on mode
  public activeTheme = computed<ThemeConfig>(() => {
    const currentMode = this.mode();
    const targetId = currentMode === 'auto' ? this.autoThemeId() : this.manualThemeId();
    const campaign = HOLIDAY_CAMPAIGNS.find(c => c.id === targetId) || HOLIDAY_CAMPAIGNS[0];
    return campaign.theme;
  });

  // Three phoenix colors for background animation
  public phoenixColors = computed<PhoenixColors>(() => {
    return this.activeTheme().phoenixColors;
  });

  // Dynamic three phoenixes (names and colors) updating in real-time with active theme
  public activePhoenixes = computed(() => {
    const theme = this.activeTheme();
    if (theme.phoenixes) {
      return theme.phoenixes;
    }
    return {
      phoenix1: { name: 'Fire Phoenix', color: theme.colors.primary },
      phoenix2: { name: 'Ice Phoenix', color: theme.colors.secondary },
      phoenix3: { name: 'Eclipse Phoenix', color: theme.colors.tertiary }
    };
  });

  // Promotional banner computed from active campaign
  public bannerContent = computed(() => {
    // If server promotion is available, use it; otherwise compute locally
    const currentCampaign = HOLIDAY_CAMPAIGNS.find(c => c.id === this.autoThemeId()) || HOLIDAY_CAMPAIGNS[0];
    return {
      name: currentCampaign.displayName,
      bannerText: currentCampaign.bannerText,
      discountPercent: this.serverPromotion()?.discountPercent ?? currentCampaign.discountPercent,
      ctaText: currentCampaign.ctaText,
      ctaLink: currentCampaign.ctaLink,
      isAuto: this.mode() === 'auto'
    };
  });

  constructor() {
    this.initFromStorage();
    this.evaluateAutoCampaign();
    this.fetchServerPromotion();

    // Effect to apply CSS variables whenever activeTheme changes
    effect(() => {
      const theme = this.activeTheme();
      this.applyCssTokens(theme);
    });
  }

  private initFromStorage() {
    try {
      const savedMode = localStorage.getItem(this.STORAGE_MODE_KEY);
      if (savedMode === 'manual' || savedMode === 'auto') {
        this.mode.set(savedMode);
      }
      const savedTheme = localStorage.getItem(this.STORAGE_MANUAL_THEME_KEY);
      if (savedTheme && HOLIDAY_CAMPAIGNS.some(c => c.id === savedTheme)) {
        this.manualThemeId.set(savedTheme);
      }
    } catch (e) {
      console.warn('Could not read theme preferences from storage', e);
    }
  }

  /**
   * Evaluates the active seasonal theme based on current date in America/Chicago
   */
  public evaluateAutoCampaign(targetDate: Date = new Date()) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: BUSINESS_TIMEZONE,
        month: 'numeric',
        day: 'numeric'
      });
      const parts = formatter.formatToParts(targetDate);
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '1', 10);
      const day = parseInt(parts.find(p => p.type === 'day')?.value || '1', 10);
      const score = month * 100 + day;

      const matches = HOLIDAY_CAMPAIGNS.filter(c => {
        if (!c.enabled || !c.dateRange) return false;
        const r = c.dateRange;
        const startScore = r.startMonth * 100 + r.startDay;
        const endScore = r.endMonth * 100 + r.endDay;
        if (r.crossYear) {
          return score >= startScore || score <= endScore;
        }
        return score >= startScore && score <= endScore;
      });

      if (matches.length > 0) {
        matches.sort((a, b) => b.priority - a.priority);
        this.autoThemeId.set(matches[0].id);
      } else {
        this.autoThemeId.set('default');
      }
    } catch (err) {
      this.autoThemeId.set('default');
    }
  }

  /**
   * Fetches authoritative promotion details from server
   */
  private fetchServerPromotion() {
    this.api.get('promotions/active').subscribe({
      next: (res: any) => {
        if (res && res.promotion) {
          this.serverPromotion.set(res.promotion);
          if (this.mode() === 'auto' && res.promotion.id) {
            this.autoThemeId.set(res.promotion.id);
          }
        }
      },
      error: () => {
        // Fallback to local evaluation
      }
    });
  }

  /**
   * Switches theme mode (AUTO vs MANUAL)
   */
  public setMode(newMode: 'auto' | 'manual') {
    this.mode.set(newMode);
    try {
      localStorage.setItem(this.STORAGE_MODE_KEY, newMode);
    } catch (e) {}
  }

  /**
   * Manually selects a theme for visual testing/preview
   * CRITICAL: This is visual only and does NOT alter pricing or checkout
   */
  public setManualTheme(themeId: string) {
    if (!HOLIDAY_CAMPAIGNS.some(c => c.id === themeId)) return;
    this.manualThemeId.set(themeId);
    this.setMode('manual');
    try {
      localStorage.setItem(this.STORAGE_MANUAL_THEME_KEY, themeId);
    } catch (e) {}
  }

  /**
   * Resets theme selection to AUTO
   */
  public returnToAuto() {
    this.setMode('auto');
    this.evaluateAutoCampaign();
  }

  /**
   * Applies CSS design tokens onto the document root
   */
  private applyCssTokens(theme: ThemeConfig) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--theme-primary', theme.colors.primary);
    root.style.setProperty('--theme-secondary', theme.colors.secondary);
    root.style.setProperty('--theme-tertiary', theme.colors.tertiary);
    root.style.setProperty('--theme-glow', theme.accentGlow);
    root.style.setProperty('--accent-fire', theme.colors.primary);
    root.style.setProperty('--accent-fire-glow', theme.accentGlow);
    root.style.setProperty('--theme-border', `${theme.colors.primary}33`);
    root.style.setProperty('--theme-bg-accent', `${theme.colors.primary}0d`);
    root.style.setProperty('--theme-cta', theme.colors.primary);
  }
}
