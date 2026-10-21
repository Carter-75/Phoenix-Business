import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

/**
 * Full-screen re-acceptance gate. When the account terms change,
 * established accounts are logged out; Google accounts land here
 * mid-login (their session can do nothing else until they accept),
 * and email accounts re-check the terms inside the login form.
 * Accepting replaces the stored acceptance and stamps the new time,
 * subscribes the account to group buy and event emails (Terms
 * section 14), and triggers the one-time welcome email with its 5%
 * code for accounts that have never received it.
 */
@Component({
  selector: 'app-terms-gate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div *ngIf="show()" class="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="max-w-lg w-full bg-[#14100a] border border-orange-500/40 rounded-2xl p-8 text-white shadow-2xl">
        <h2 class="text-2xl font-black uppercase tracking-tight mb-3">Our terms were <span class="text-orange-500">updated</span></h2>
        <p class="text-sm text-white/75 leading-relaxed mb-4">
          Before you continue, please re-accept the current Terms of Service. The latest
          update adds occasional group buy and event announcement emails for account holders,
          with an unsubscribe option in every announcement. Accepting replaces your previous
          acceptance on file and records today's date.
        </p>
        <label class="flex items-start gap-3 text-sm text-white/85 leading-relaxed mb-6 cursor-pointer">
          <input type="checkbox" [checked]="checked()" (change)="checked.set($any($event.target).checked)" class="mt-1 accent-orange-500 w-4 h-4 shrink-0">
          <span>I have read and accept the updated
            <a routerLink="/terms" class="underline text-orange-300">Terms of Service</a>,
            Privacy Policy, and Refund Policy.</span>
        </label>
        <div class="flex flex-wrap gap-3">
          <button (click)="accept()" [disabled]="!checked() || busy()"
            class="px-6 py-3 rounded-lg bg-orange-500 hover:bg-orange-400 font-black uppercase tracking-wider text-xs disabled:opacity-40 cursor-pointer">
            {{ busy() ? 'Saving...' : 'Accept and continue' }}
          </button>
          <button (click)="logout()" class="px-6 py-3 rounded-lg border border-white/25 hover:bg-white/10 font-black uppercase tracking-wider text-xs cursor-pointer">
            Log out instead
          </button>
        </div>
        <p *ngIf="error()" class="text-xs text-red-300 mt-4">{{ error() }}</p>
      </div>
    </div>
  `
})
export class TermsGateComponent {
  private api = inject(ApiService);
  protected readonly checked = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected show(): boolean {
    const u = this.api.currentUser();
    return !!u && !!u.needsTermsUpdate && !u.isPending;
  }

  protected accept() {
    this.busy.set(true);
    this.error.set('');
    this.api.post<any>('auth/accept-terms', {}).subscribe({
      next: () => {
        this.api.checkStatus().subscribe({ next: () => this.busy.set(false), error: () => this.busy.set(false) });
      },
      error: () => {
        this.busy.set(false);
        this.error.set('That did not save. Please try again.');
      }
    });
  }

  protected logout() {
    this.api.logout();
    window.location.href = '/';
  }
}
