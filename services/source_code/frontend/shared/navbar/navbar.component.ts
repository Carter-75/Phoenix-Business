import {
  Component, ElementRef, ViewChild, signal, inject, AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import gsap from 'gsap';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './navbar.component.html',
  styles: [`
    :host {
      @apply block fixed top-0 left-0 right-0 z-[100];
    }
    .nav-container {
      @apply transition-all duration-500 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/5;
    }
    .hamburger-line {
      @apply block w-6 h-0.5 bg-white transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.3)];
    }
    .glass-button {
      @apply bg-white/5 rounded-lg border border-white/10 active:scale-95 transition-all;
    }
  `]
})
export class NavbarComponent implements AfterViewInit {
  @ViewChild('progressBar', { static: true }) progressBarRef!: ElementRef<HTMLDivElement>;

  private router = inject(Router);
  private http = inject(HttpClient);
  private previouslyFocused: HTMLElement | null = null;

  isMenuOpen = signal(false);

  // --- Hidden Debug Menu ---
  debugClicks = signal(0);
  isDebugOpen = signal(false);
  testEmail = signal('');
  isSendingTest = signal(false);
  testStatus = signal<'idle' | 'success' | 'error'>('idle');

  handleLogoClick() {
    this.closeMenu();
    this.debugClicks.update(n => n + 1);
    
    if (this.debugClicks() >= 10) {
      this.isDebugOpen.set(true);
      this.debugClicks.set(0);
    } else {
      this.router.navigate(['/home']);
    }
  }

  sendTestEmail() {
    if (!this.testEmail() || !this.testEmail().includes('@')) return;
    
    this.isSendingTest.set(true);
    this.http.post(`${environment.apiUrl}/leads/test-outreach`, {
      email: this.testEmail()
    }).subscribe({
      next: () => {
        this.isSendingTest.set(false);
        this.testStatus.set('success');
        setTimeout(() => this.closeDebug(), 2000);
      },
      error: () => {
        this.isSendingTest.set(false);
        this.testStatus.set('error');
      }
    });
  }

  closeDebug() {
    this.isDebugOpen.set(false);
    this.testStatus.set('idle');
    this.testEmail.set('');
  }

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe(e => this.handleRouteProgress(e));
  }

  ngAfterViewInit() {
    // Bar starts hidden — GSAP controls its visibility
    gsap.set(this.progressBarRef.nativeElement, { scaleX: 0, opacity: 0, transformOrigin: 'left center' });
  }

  private handleRouteProgress(event: unknown) {
    const bar = this.progressBarRef?.nativeElement;
    if (!bar) return;

    if (event instanceof NavigationStart) {
      gsap.killTweensOf(bar);
      gsap.set(bar, { scaleX: 0, opacity: 1, transformOrigin: 'left center' });
      gsap.to(bar, { scaleX: 0.85, duration: 0.8, ease: 'power2.out' });
    }

    if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
      gsap.to(bar, {
        scaleX: 1, duration: 0.2, ease: 'none',
        onComplete: () => gsap.to(bar, {
          opacity: 0, duration: 0.35, delay: 0.1,
          onComplete: () => gsap.set(bar, { scaleX: 0 })
        })
      });
    }
  }

  toggleMenu() {
    if (this.isMenuOpen()) {
      this.closeMenu();
    } else {
      this.previouslyFocused = document.activeElement as HTMLElement;
      this.isMenuOpen.set(true);
      this.syncScrollLock();
      // Focus first interactive item after Angular renders the overlay
      queueMicrotask(() => {
        (document.querySelector('[data-mobile-menu] a') as HTMLElement)?.focus();
      });
    }
  }

  closeMenu() {
    this.isMenuOpen.set(false);
    this.syncScrollLock();
    this.previouslyFocused?.focus();
    this.previouslyFocused = null;
  }

  onMenuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeMenu();
      return;
    }
    if (event.key === 'Tab') {
      const overlay = document.querySelector('[data-mobile-menu]');
      if (!overlay) return;
      const focusable = Array.from(
        overlay.querySelectorAll<HTMLElement>('a[routerLink], button:not([disabled])')
      );
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  private syncScrollLock() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = this.isMenuOpen() ? 'hidden' : '';
    }
  }
}
