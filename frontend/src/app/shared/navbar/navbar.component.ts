import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 w-full z-[110] transition-all duration-1000" 
         [class.bg-[#020205]/80]="scrolled()" [class.backdrop-blur-3xl]="scrolled()" [class.py-8]="scrolled()" [class.py-12]="!scrolled()">
      <div class="max-w-[1400px] mx-auto px-8 sm:px-16 flex items-center justify-between">
        <!-- Logo -->
        <a routerLink="/" class="flex items-center gap-4 group">
          <div class="w-8 h-[1px] bg-[#D4AF37] group-hover:w-12 transition-all duration-700"></div>
          <span class="text-white font-black uppercase tracking-[0.8em] text-[10px] group-hover:text-[#D4AF37] transition-colors">Phoenix</span>
        </a>

        <!-- Navigation Pages -->
        <div class="hidden md:flex items-center gap-12 lg:gap-16">
          <a routerLink="/home" routerLinkActive="text-white !after:w-full" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Home</a>
          <a routerLink="/about" routerLinkActive="text-white !after:w-full" class="nav-link">About</a>
          <a routerLink="/services" routerLinkActive="text-white !after:w-full" class="nav-link">Services</a>
          <a routerLink="/data" routerLinkActive="text-white !after:w-full" class="nav-link">Data</a>
          <a routerLink="/reviews" routerLinkActive="text-white !after:w-full" class="nav-link">Reviews</a>
          <a href="https://carter-portfolio.fyi" target="_blank" class="nav-link !text-orange-500/80 hover:!text-orange-500 flex items-center gap-2">
            Carter's Portfolio
          </a>
        </div>

        <!-- Auth Action, Cart, and Mobile Toggle -->
        <div class="flex items-center gap-6 sm:gap-8">
          <!-- Global Cart Button -->
          <button *ngIf="cartCount() > 0" (click)="openCart()" class="relative group cursor-pointer" title="View Cart">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              <span class="text-[9px] font-black uppercase tracking-widest text-orange-400">Cart</span>
            </div>
            <!-- Badge -->
            <span class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[9px] font-black px-1 shadow-lg shadow-orange-500/40 animate-pulse">
              {{ cartCount() }}
            </span>
          </button>

          <a *ngIf="!api.currentUser()" routerLink="/services" [queryParams]="{login: 'true'}" class="hidden sm:block text-[10px] font-black uppercase tracking-[0.4em] text-white/30 hover:text-[#D4AF37] transition-all">
            Login
          </a>

          <!-- Profile Dropdown Container -->
          <div *ngIf="api.currentUser()" class="relative group hidden lg:block cursor-pointer py-4">
            <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-colors">
              <i class="fa-solid fa-user-circle text-[#D4AF37]"></i> 
              <span>{{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }} <span *ngIf="api.currentUser()?.businessName" class="text-slate-500">({{ api.currentUser()?.businessName }})</span></span>
              <i class="fa-solid fa-chevron-down text-[8px] ml-1 transition-transform group-hover:rotate-180"></i>
            </div>
            
            <!-- Dropdown Menu -->
            <div class="absolute right-0 top-full mt-[-8px] w-full min-w-[160px] bg-[#05050A] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden">
              <button (click)="api.logout()" class="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-red-500 hover:bg-white/5 transition-all flex items-center gap-3">
                <i class="fa-solid fa-right-from-bracket"></i> Logout
              </button>
            </div>
          </div>
          
          <!-- Hamburger Button -->
          <button (click)="toggleMobileMenu()" class="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 z-[110] relative">
            <div class="w-6 h-[1px] bg-white transition-all duration-300" [class.rotate-45]="mobileMenuOpen()" [class.translate-y-[7px]]="mobileMenuOpen()"></div>
            <div class="w-6 h-[1px] bg-white transition-all duration-300" [class.opacity-0]="mobileMenuOpen()"></div>
            <div class="w-6 h-[1px] bg-white transition-all duration-300" [class.-rotate-45]="mobileMenuOpen()" [class.-translate-y-[7px]]="mobileMenuOpen()"></div>
          </button>
        </div>
      </div>
    </nav>

    <!-- Mobile Menu Overlay -->
    <div class="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[105] overflow-y-auto overscroll-none transition-all duration-500"
         [class.opacity-100]="mobileMenuOpen()" [class.pointer-events-auto]="mobileMenuOpen()"
         [class.opacity-0]="!mobileMenuOpen()" [class.pointer-events-none]="!mobileMenuOpen()">
      <div class="min-h-full w-full flex flex-col justify-start items-center pt-32 pb-20 gap-8 sm:gap-12 transition-transform duration-700" [class.translate-y-0]="mobileMenuOpen()" [class.translate-y-8]="!mobileMenuOpen()">
        <a routerLink="/home" (click)="closeMobileMenu()" class="text-3xl font-black uppercase tracking-[0.2em] hover:text-[#D4AF37] transition-colors">Home</a>
        <a routerLink="/about" (click)="closeMobileMenu()" class="text-3xl font-black uppercase tracking-[0.2em] hover:text-[#D4AF37] transition-colors">About</a>
        <a routerLink="/services" (click)="closeMobileMenu()" class="text-3xl font-black uppercase tracking-[0.2em] hover:text-[#D4AF37] transition-colors">Services</a>
        <a routerLink="/data" (click)="closeMobileMenu()" class="text-3xl font-black uppercase tracking-[0.2em] hover:text-[#D4AF37] transition-colors">Data</a>
        <a routerLink="/reviews" (click)="closeMobileMenu()" class="text-3xl font-black uppercase tracking-[0.2em] hover:text-[#D4AF37] transition-colors">Reviews</a>
        
        <div class="w-12 h-[1px] bg-white/10 my-2"></div>
        
        <a href="https://carter-portfolio.fyi" target="_blank" class="text-xl font-black uppercase tracking-[0.2em] text-orange-500/80 hover:text-orange-500 transition-colors">Carter's Portfolio</a>

        <!-- Mobile Cart Button -->
        <button *ngIf="cartCount() > 0" (click)="openCart(); closeMobileMenu()" class="flex items-center gap-3 text-xl font-black uppercase tracking-[0.2em] text-orange-400 hover:text-orange-300 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          Cart ({{ cartCount() }})
        </button>

        <div class="w-12 h-[1px] bg-white/10 my-2"></div>
        
        <a *ngIf="!api.currentUser()" routerLink="/services" [queryParams]="{login: 'true'}" (click)="closeMobileMenu()" class="text-sm font-black uppercase tracking-[0.4em] text-white/50 hover:text-[#D4AF37] transition-colors">
          Login
        </a>

        <div *ngIf="api.currentUser()" class="text-xs font-bold uppercase tracking-[0.1em] text-slate-500 text-center flex flex-col gap-1 items-center">
          <i class="fa-solid fa-user-circle text-2xl text-slate-600 mb-1"></i>
          <span>{{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }}</span>
          <span *ngIf="api.currentUser()?.businessName" class="text-slate-600">({{ api.currentUser()?.businessName }})</span>
        </div>

        <button *ngIf="api.currentUser()" (click)="api.logout(); closeMobileMenu()" class="text-sm font-black uppercase tracking-[0.4em] text-white/50 hover:text-red-500 transition-colors">
          Logout
        </button>
      </div>
    </div>
  `
})
export class NavbarComponent implements OnInit {
  public api = inject(ApiService);
  private router = inject(Router);
  scrolled = signal(false);
  mobileMenuOpen = signal(false);

  // Computed cart count from shared API service signal (handles both data + service items)
  cartCount = computed(() => this.api.getCartItemCount());

  ngOnInit() {
    this.api.checkStatus().subscribe({
      next: (user) => {
        if (user) this.api.loadCart();
      }
    });
    window.addEventListener('scroll', () => {
      this.scrolled.set(window.scrollY > 50);
    });
  }

  /** Navigate to data portal with cart open */
  openCart() {
    this.router.navigate(['/data'], { queryParams: { cart: 'open' } });
  }

  scrollToAudit() {
    this.mobileMenuOpen.set(false);
    const audit = document.querySelector('input[type="email"]') || document.querySelector('.audit-section');
    if (audit) {
      audit.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/home#audit';
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
    this.updateBodyScroll();
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
    this.updateBodyScroll();
  }

  private updateBodyScroll() {
    if (this.mobileMenuOpen()) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
