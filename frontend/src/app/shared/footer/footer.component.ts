import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConnectPanelComponent } from '../connect-panel/connect-panel.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, ConnectPanelComponent],
  template: `
    <footer class="px-3 sm:px-6 pb-3 sm:pb-4 pt-6">
      <div class="glass-panel max-w-[1400px] mx-auto px-8 sm:px-12 py-10 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12">
      <div class="flex items-center gap-2.5">
        <span class="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/30">
          <i class="fa-solid fa-fire text-[#FF4D00] text-sm" aria-hidden="true"></i>
        </span>
        <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-white">Phoenix <span class="text-[#FF4D00]">Websites AI</span></span>
      </div>

      <div class="flex flex-wrap justify-center gap-6 sm:gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
        <a href="tel:+17603347874" class="hover:text-orange-500 text-orange-400/80 transition-colors flex items-center gap-2"><i class="fa-solid fa-phone" aria-hidden="true"></i> +1 (760) 334-7874</a>
        <a routerLink="/terms" class="hover:text-white transition-colors">Terms</a>
        <a routerLink="/privacy" class="hover:text-white transition-colors">Privacy</a>
        <a routerLink="/refunds" class="hover:text-white transition-colors">Refunds</a>
      </div>

      <app-connect-panel></app-connect-panel>
      <div class="flex flex-col items-center gap-4">
        <div class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-center">
          © 2026 PHOENIX WEBSITES AI | BASED IN WISCONSIN, USA
        </div>
        <a href="https://carter-portfolio.fyi" target="_blank" class="text-[9px] font-black uppercase tracking-[0.4em] text-orange-600/60 hover:text-orange-600 transition-colors flex items-center gap-2">
          Developed by Carter
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
      </div>
    </footer>
  `
})
export class FooterComponent {}
