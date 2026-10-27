import { Injectable, signal, effect, inject } from '@angular/core';
import { ThemePromotionService } from './theme-promotion.service';
import { ApiService } from './api.service';

export interface PhoenixConfig {
  fire: boolean;
  ice: boolean;
  eclipse: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PhoenixSettingsService {
  private readonly STORAGE_KEY = 'phoenix_settings_v1';
  public themePromo = inject(ThemePromotionService);
  private api = inject(ApiService);

  public fireEnabled = signal(true);
  public iceEnabled = signal(true);
  public eclipseEnabled = signal(true);

  // Master switch for ALL phoenixes, for every visitor. Stored on the
  // server (site settings) and controlled only from the owner's
  // dashboard. Defaults to OFF and stays off until the server value
  // loads, so the phoenixes never flash on for anyone by default.
  public phoenixesEnabled = signal(false);
  public phoenixesSaving = signal(false);
  public phoenixesError = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();
    this.loadGlobalSetting();
  }

  private loadGlobalSetting() {
    this.api.get<any>('site-settings').subscribe({
      next: (res) => this.phoenixesEnabled.set(!!res?.phoenixesEnabled),
      error: () => { /* stays off */ }
    });
  }

  public setPhoenixesEnabled(enabled: boolean) {
    this.phoenixesSaving.set(true);
    this.phoenixesError.set(null);
    this.api.patch<any>('site-settings', { phoenixesEnabled: enabled }).subscribe({
      next: (res) => {
        this.phoenixesEnabled.set(!!res?.phoenixesEnabled);
        this.phoenixesSaving.set(false);
      },
      error: () => {
        this.phoenixesError.set('Could not save that setting. Try again.');
        this.phoenixesSaving.set(false);
        this.loadGlobalSetting();
      }
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const config: PhoenixConfig = JSON.parse(stored);
        this.fireEnabled.set(config.fire ?? true);
        this.iceEnabled.set(config.ice ?? true);
        this.eclipseEnabled.set(config.eclipse ?? true);
      }
    } catch (e) {
      console.warn('Could not load phoenix settings', e);
    }
  }

  public toggleBird(type: 'fire' | 'ice' | 'eclipse') {
    if (type === 'fire') this.fireEnabled.update(v => !v);
    if (type === 'ice') this.iceEnabled.update(v => !v);
    if (type === 'eclipse') this.eclipseEnabled.update(v => !v);
    
    this.saveToStorage();
  }

  private saveToStorage() {
    const config: PhoenixConfig = {
      fire: this.fireEnabled(),
      ice: this.iceEnabled(),
      eclipse: this.eclipseEnabled()
    };
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (e) {
      console.warn('Could not save phoenix settings', e);
    }
  }
}
