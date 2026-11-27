import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { VoiceCallService } from '../../services/voice-call.service';

// Navbar redesigned Nov 26, 2026 to Carter's approved target: a floating
// glass pill bar, and on mobile a detached floating menu panel under it.
// Nav links run their own page transition (navGo): the exit animation
// finishes before the router moves. The global interceptor in app.ts
// skips app-navbar anchors, so these clicks are owned here alone.
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="sticky top-3 sm:top-4 z-[110] px-3 sm:px-6">
      <div class="relative max-w-[1400px] mx-auto">
        <nav class="rounded-full border border-white/10 bg-[#050508]/70 backdrop-blur-2xl shadow-[0_18px_50px_rgba(0,0,0,0.55)] transition-all duration-500"
             [class.bg-[#050508]/85]="scrolled()">
          <div class="flex items-center justify-between gap-3 pl-4 pr-2 sm:pl-6 sm:pr-3 py-2">
            <!-- Logo -->
            <a href="/" (click)="navGo($event, '/')" class="press-spring flex items-center gap-2.5 shrink-0" aria-label="Phoenix Websites AI home">
              <span class="flex items-center justify-center w-8 h-8 rounded-full bg-[#FF4D00]/15 border border-[#FF4D00]/30">
                <i class="fa-solid fa-fire text-[#FF4D00] text-sm" aria-hidden="true"></i>
              </span>
              <span class="text-[11px] sm:text-xs font-black uppercase tracking-[0.22em] text-white whitespace-nowrap">Phoenix <span class="text-[#FF4D00]">Websites AI</span></span>
            </a>

            <!-- Desktop links -->
            <div class="hidden lg:flex items-center gap-4 xl:gap-7">
              <a href="/" (click)="navGo($event, '/')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/'">Home</a>
              <a href="/about" (click)="navGo($event, '/about')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/about'">About</a>
              <a href="/services" (click)="navGo($event, '/services')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/services'">Services</a>
              <a href="/data-cleanup" (click)="navGo($event, '/data-cleanup')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/data-cleanup'">Data Cleanup</a>
              <a href="/reviews" (click)="navGo($event, '/reviews')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/reviews'">Reviews</a>
              <a *ngIf="api.currentUser()" href="/dashboard" (click)="navGo($event, '/dashboard')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/dashboard'">Dashboard</a>
              <a *ngIf="isOwner()" href="/owner" (click)="navGo($event, '/owner')" class="nav-link !py-2" [class.nav-on]="currentPath() === '/owner'">Owner</a>
              <a href="https://carter-portfolio.fyi" target="_blank" class="nav-link !py-2 !text-orange-500/80 hover:!text-orange-500">Portfolio</a>
            </div>

            <div class="flex items-center gap-2 sm:gap-3 shrink-0">
              <!-- Voice call -->
              <button (click)="voiceCall.startCall()" aria-label="Start a voice call with the AI assistant" class="press-spring hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-orange-600/20 border border-orange-500/40 hover:bg-orange-600 text-orange-400 hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors">
                <i class="fas fa-phone" aria-hidden="true"></i>
                <span>Call AI</span>
              </button>
              <button (click)="voiceCall.startCall()" aria-label="Start a voice call with the AI assistant" class="press-spring sm:hidden flex items-center justify-center w-9 h-9 rounded-full border border-orange-500/40 bg-orange-600/20 text-orange-400">
                <i class="fas fa-phone text-xs" aria-hidden="true"></i>
              </button>

              <a *ngIf="!api.currentUser()" href="/services?login=true" (click)="navGo($event, '/services?login=true')" class="hidden md:block text-[10px] font-black uppercase tracking-[0.35em] text-white/40 hover:text-orange-500 transition-colors px-1">Login</a>

              <!-- Audit CTA -->
              <a href="/" (click)="auditGo($event)" class="press-spring hidden md:inline-flex items-center px-5 py-2.5 rounded-full bg-[#FF4D00] hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.22em] transition-colors shadow-[0_8px_24px_rgba(255,77,0,0.35)]">Get a Free Audit</a>

              <!-- Profile dropdown -->
              <div *ngIf="api.currentUser()" class="relative group hidden lg:block cursor-pointer">
                <div tabindex="0" role="button" aria-haspopup="true" aria-label="Account menu" class="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-[9px] font-bold text-slate-300 uppercase tracking-widest hover:bg-white/10 transition-colors">
                  <i class="fa-solid fa-user-circle text-orange-500" aria-hidden="true"></i>
                  <span class="max-w-[130px] truncate lowercase">{{ api.currentUser()?.email }}</span>
                  <i class="fa-solid fa-chevron-down text-[8px] ml-1 transition-transform group-hover:rotate-180"></i>
                </div>
                <div class="absolute right-0 top-full mt-2 w-64 bg-[#05050A] border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible group-focus-within:scale-100 transition-all duration-300 transform origin-top-right scale-95 group-hover:scale-100 overflow-hidden z-[120]">
                  <div class="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                    <div class="text-[10px] font-bold text-white truncate">{{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }}</div>
                    <div class="text-[9px] font-mono text-orange-400 truncate lowercase">{{ api.currentUser()?.email }}</div>
                    <div *ngIf="api.currentUser()?.businessName" class="text-[8px] text-white/40 truncate mt-0.5">{{ api.currentUser()?.businessName }}</div>
                  </div>
                  <a href="/dashboard" (click)="navGo($event, '/dashboard')" class="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-orange-500 hover:bg-white/5 transition-all flex items-center gap-3 no-underline">
                    <i class="fa-solid fa-gauge"></i> Dashboard
                  </a>
                  <button (click)="api.logout()" class="w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-red-500 hover:bg-white/5 transition-all flex items-center gap-3">
                    <i class="fa-solid fa-right-from-bracket"></i> Logout
                  </button>
                </div>
              </div>

              <!-- Mobile menu button -->
              <button (click)="toggleMobileMenu()" aria-label="Toggle navigation menu" [attr.aria-expanded]="mobileMenuOpen()" class="press-spring lg:hidden flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/5 text-white">
                <i class="fa-solid text-sm" [class.fa-bars]="!mobileMenuOpen()" [class.fa-xmark]="mobileMenuOpen()" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </nav>

        <!-- Mobile menu: detached floating panel -->
        <div class="lg:hidden absolute inset-x-0 top-full mt-2 rounded-[1.75rem] border border-white/10 bg-[#050508]/95 backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.65)] overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-spring-soft)]"
             [class.opacity-100]="mobileMenuOpen()" [class.translate-y-0]="mobileMenuOpen()" [class.scale-100]="mobileMenuOpen()"
             [class.opacity-0]="!mobileMenuOpen()" [class.-translate-y-3]="!mobileMenuOpen()" [class.scale-[0.98]]="!mobileMenuOpen()"
             [class.pointer-events-auto]="mobileMenuOpen()" [class.pointer-events-none]="!mobileMenuOpen()" [class.invisible]="!mobileMenuOpen()">
          <div class="max-h-[72vh] overflow-y-auto px-6 py-6 flex flex-col items-center text-center">
            <a href="/" (click)="navGo($event, '/')" class="text-2xl font-black uppercase tracking-[0.18em] py-2.5 hover:text-[#FF4D00] transition-colors" [class.text-[#FF4D00]]="currentPath() === '/'">Home</a>
            <a href="/about" (click)="navGo($event, '/about')" class="text-2xl font-black uppercase tracking-[0.18em] py-2.5 hover:text-[#FF4D00] transition-colors" [class.text-[#FF4D00]]="currentPath() === '/about'">About</a>
            <a href="/services" (click)="navGo($event, '/services')" class="text-2xl font-black uppercase tracking-[0.18em] py-2.5 hover:text-[#FF4D00] transition-colors" [class.text-[#FF4D00]]="currentPath() === '/services'">Services</a>
            <a href="/data-cleanup" (click)="navGo($event, '/data-cleanup')" class="text-2xl font-black uppercase tracking-[0.18em] py-2.5 hover:text-[#FF4D00] transition-colors" [class.text-[#FF4D00]]="currentPath() === '/data-cleanup'">Data Cleanup</a>
            <a href="/reviews" (click)="navGo($event, '/reviews')" class="text-2xl font-black uppercase tracking-[0.18em] py-2.5 hover:text-[#FF4D00] transition-colors" [class.text-[#FF4D00]]="currentPath() === '/reviews'">Reviews</a>

            <div class="w-12 h-[1px] bg-white/10 my-3"></div>

            <a href="https://carter-portfolio.fyi" target="_blank" class="text-base font-black uppercase tracking-[0.18em] py-2 text-orange-500/80 hover:text-orange-500 transition-colors">Carter's Portfolio</a>
            <a *ngIf="api.currentUser()" href="/dashboard" (click)="navGo($event, '/dashboard')" class="text-base font-black uppercase tracking-[0.18em] py-2 text-[#FF4D00] hover:text-white transition-colors flex items-center gap-3">
              <i class="fa-solid fa-gauge text-sm"></i> Dashboard
            </a>
            <a *ngIf="isOwner()" href="/owner" (click)="navGo($event, '/owner')" class="text-base font-black uppercase tracking-[0.18em] py-2 text-[#FF4D00] hover:text-white transition-colors flex items-center gap-3">
              <i class="fa-solid fa-crown text-sm"></i> Owner
            </a>

            <div class="w-12 h-[1px] bg-white/10 my-3"></div>

            <a *ngIf="!api.currentUser()" href="/services?login=true" (click)="navGo($event, '/services?login=true')" class="text-xs font-black uppercase tracking-[0.35em] py-2 text-white/50 hover:text-[#FF4D00] transition-colors">Login</a>

            <div *ngIf="api.currentUser()" class="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 flex flex-col gap-1 items-center px-4 py-3 bg-white/5 rounded-2xl border border-white/10 mt-1">
              <i class="fa-solid fa-user-circle text-2xl text-[#FF4D00] mb-1"></i>
              <span class="text-white">{{ api.currentUser()?.firstName }} {{ api.currentUser()?.lastName }}</span>
              <span class="text-[10px] font-mono text-orange-400 lowercase tracking-normal">{{ api.currentUser()?.email }}</span>
              <span *ngIf="api.currentUser()?.businessName" class="text-[9px] text-slate-400">({{ api.currentUser()?.businessName }})</span>
            </div>

            <button *ngIf="api.currentUser()" (click)="api.logout(); closeMobileMenu()" class="text-xs font-black uppercase tracking-[0.35em] py-2 mt-1 text-white/50 hover:text-red-500 transition-colors">Logout</button>

            <a href="/" (click)="auditGo($event)" class="press-spring mt-4 w-full py-4 rounded-full bg-[#FF4D00] hover:bg-orange-500 text-white text-xs font-black uppercase tracking-[0.25em] transition-colors text-center">Get a Free Audit</a>
          </div>
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent implements OnInit {
  public api = inject(ApiService);
  public voiceCall = inject(VoiceCallService);
  private router = inject(Router);
  isOwner = computed(() => {
    const u: any = this.api.currentUser();
    return !!u && u.isOwner === true;
  });
  scrolled = signal(false);
  mobileMenuOpen = signal(false);
  currentPath = signal('/');
  private leaving = false;

  ngOnInit() {
    this.api.checkStatus().subscribe({
      next: (user) => {
        if (user) this.api.loadCart();
      }
    });
    window.addEventListener('scroll', () => {
      this.scrolled.set(window.scrollY > 50);
    });
    this.currentPath.set(window.location.pathname);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.currentPath.set(new URL(e.urlAfterRedirects, window.location.origin).pathname);
      }
    });
  }

  // Nav-owned page transition: the exit animation finishes (240ms), then
  // the router moves. One tap, every time. Modified clicks (new tab and
  // friends) fall through to the browser default.
  navGo(event: MouseEvent, path: string) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.closeMobileMenu();
    const here = window.location.pathname + window.location.search;
    if (path === here) return;
    this.transitionTo(path);
  }

  auditGo(event: MouseEvent) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.closeMobileMenu();
    if (window.location.pathname === '/') {
      this.scrollToAudit();
      return;
    }
    this.transitionTo('/', () => window.setTimeout(() => this.scrollToAudit(), 450));
  }

  private transitionTo(path: string, after?: () => void) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || this.leaving) {
      this.router.navigateByUrl(path).finally(() => { if (after) after(); });
      return;
    }
    this.leaving = true;
    document.body.classList.add('page-exit');
    window.setTimeout(() => {
      this.router.navigateByUrl(path).finally(() => {
        document.body.classList.remove('page-exit');
        this.leaving = false;
        if (after) after();
      });
    }, 240);
  }

  scrollToAudit() {
    this.mobileMenuOpen.set(false);
    this.updateBodyScroll();
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
