import { Injectable, signal, effect } from '@angular/core';

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
  
  public fireEnabled = signal(true);
  public iceEnabled = signal(true);
  public eclipseEnabled = signal(true);

  constructor() {
    this.loadFromStorage();
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
