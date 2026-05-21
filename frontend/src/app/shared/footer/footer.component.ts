import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="py-20 px-8 sm:px-16 lg:px-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 md:gap-12 bg-[#050505]">
      <div class="flex items-center gap-4">
        <div class="w-8 h-[1px] bg-[#D4AF37]"></div>
        <span class="text-white font-black uppercase tracking-[0.8em] text-xs">Phoenix</span>
      </div>
      
      <div class="flex flex-wrap justify-center gap-6 sm:gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
        <a routerLink="/terms" class="hover:text-white transition-colors">Terms</a>
        <a routerLink="/privacy" class="hover:text-white transition-colors">Privacy</a>
        <a routerLink="/refunds" class="hover:text-white transition-colors">Refunds</a>
      </div>

      <div class="flex flex-col items-center gap-4">
        <div class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-center">
          © 2026 PHOENIX OPERATIONS — BASED IN WISCONSIN
        </div>
        <a href="https://carter-portfolio.fyi" target="_blank" class="text-[9px] font-black uppercase tracking-[0.4em] text-orange-600/60 hover:text-orange-600 transition-colors flex items-center gap-2">
          Developed by Carter
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
        </a>
      </div>
    </footer>
  `
})
export class FooterComponent {}
