import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="py-20 px-8 sm:px-16 lg:px-32 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 bg-[#050505]">
      <div class="flex items-center gap-4">
        <div class="w-8 h-[1px] bg-[#D4AF37]"></div>
        <span class="text-white font-black uppercase tracking-[0.8em] text-xs">Phoenix</span>
      </div>
      
      <div class="flex gap-12 text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
        <a routerLink="/terms" class="hover:text-white transition-colors">Terms</a>
        <a routerLink="/privacy" class="hover:text-white transition-colors">Privacy</a>
        <a routerLink="/refunds" class="hover:text-white transition-colors">Refunds</a>
      </div>

      <div class="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
        © 2026 PHOENIX OPERATIONS — BASED IN WISCONSIN
      </div>
    </footer>
  `
})
export class FooterComponent {}
