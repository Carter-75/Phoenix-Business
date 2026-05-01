import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 w-full z-[100] transition-all duration-1000" 
         [class.bg-[#050505]/95]="scrolled()" [class.backdrop-blur-3xl]="scrolled()" [class.py-6]="scrolled()" [class.py-10]="!scrolled()">
      <div class="max-w-[1600px] mx-auto px-8 sm:px-16 flex items-center justify-between">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-4 group">
          <div class="w-8 h-[1px] bg-white group-hover:w-12 transition-all duration-700"></div>
          <span class="text-white font-black uppercase tracking-[0.5em] text-sm group-hover:text-[#D4AF37] transition-colors">Phoenix</span>
        </a>

        <!-- Navigation Pages -->
        <div class="hidden md:flex items-center gap-16">
          <a routerLink="/home" routerLinkActive="text-white !after:w-full" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Home</a>
          <a routerLink="/about" routerLinkActive="text-white !after:w-full" class="nav-link">About</a>
          <a routerLink="/services" routerLinkActive="text-white !after:w-full" class="nav-link">Services</a>
        </div>

        <!-- Contact Action -->
        <div class="flex items-center">
          <button (click)="scrollToAudit()" class="fluid-tiny font-black uppercase tracking-[0.4em] text-white/50 hover:text-[#D4AF37] transition-all hidden sm:block">
            Inquire
          </button>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  scrolled = signal(false);

  ngOnInit() {
    window.addEventListener('scroll', () => {
      this.scrolled.set(window.scrollY > 50);
    });
  }

  scrollToAudit() {
    const audit = document.querySelector('input[type="email"]') || document.querySelector('.audit-section');
    if (audit) {
      audit.scrollIntoView({ behavior: 'smooth' });
    } else {
      // If not on home page, navigate home then scroll? 
      // For now, keep it simple.
      window.location.href = '/home#audit';
    }
  }
}
