import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 w-full z-[100] transition-all duration-500" 
         [class.bg-slate-950/80]="scrolled()" [class.backdrop-blur-xl]="scrolled()" [class.py-4]="scrolled()" [class.py-8]="!scrolled()">
      <div class="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-110 transition-transform">
            <span class="text-white font-black text-xl">P</span>
          </div>
          <span class="text-white font-black uppercase tracking-tighter text-2xl">Phoenix</span>
        </a>

        <!-- Desktop Links -->
        <div class="hidden md:flex items-center gap-12">
          <a routerLink="/home" routerLinkActive="text-white !after:w-full" class="nav-link">Home</a>
          <a routerLink="/services" routerLinkActive="text-white !after:w-full" class="nav-link">Services</a>
          <a routerLink="/dashboard" *ngIf="user()" routerLinkActive="text-white !after:w-full" class="nav-link">Dashboard</a>
        </div>

        <!-- Auth Actions -->
        <div class="flex items-center gap-6">
          <ng-container *ngIf="!user()">
            <a routerLink="/login" class="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">Login</a>
            <a routerLink="/register" class="primary-btn !py-3 !px-8 !text-[10px]">Start Rising</a>
          </ng-container>

          <div *ngIf="user()" class="flex items-center gap-4">
            <div class="text-right hidden sm:block">
              <p class="text-[10px] font-black text-white uppercase tracking-widest">{{ user().firstName }}</p>
              <p class="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{{ user().subscriptionStatus }}</p>
            </div>
            <button (click)="logout()" class="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
               <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  private api = inject(ApiService);
  scrolled = signal(false);
  user = signal<any>(null);

  ngOnInit() {
    window.addEventListener('scroll', () => {
      this.scrolled.set(window.scrollY > 50);
    });

    this.api.get('auth/user').subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null)
    });
  }

  logout() {
    this.api.get('auth/logout').subscribe(() => {
      window.location.reload();
    });
  }
}
