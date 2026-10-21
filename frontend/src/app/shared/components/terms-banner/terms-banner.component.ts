import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../services/api.service';

/**
 * Shown to signed-in accounts whose stored terms acceptance is older
 * than the current account terms version. Accepting replaces the old
 * acceptance record and stamps the new time (backend), and subscribes
 * the account to group buy and event announcement emails under Terms
 * section 13. There is no dismiss: the banner stays until accepted.
 */
@Component({
  selector: 'app-terms-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside *ngIf="user()?.needsTermsUpdate" aria-label="Updated terms"
      class="relative z-[130] w-full bg-[#1a1206] border-b border-orange-500/40 py-3 px-4">
      <div class="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left">
        <p class="text-xs sm:text-sm text-white/90 leading-relaxed">
          <strong class="text-orange-300">Our terms were updated.</strong>
          The update adds occasional group buy and event announcement emails for account
          holders (unsubscribe in every email). Please review and accept the new terms.
          Your previous acceptance will be replaced with the new one, with today's date.
        </p>
        <div class="flex items-center gap-3 shrink-0">
          <a routerLink="/terms" class="text-xs font-bold uppercase tracking-wider text-white/70 hover:text-white underline underline-offset-4">Read the terms</a>
          <button (click)="accept()" [disabled]="busy()"
            class="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 cursor-pointer">
            {{ busy() ? 'Saving...' : 'Accept updated terms' }}
          </button>
        </div>
      </div>
      <p *ngIf="error()" class="text-center text-xs text-red-300 mt-2">{{ error() }}</p>
    </aside>
  `
})
export class TermsBannerComponent {
  private api = inject(ApiService);
  protected readonly user = this.api.currentUser;
  protected readonly busy = signal(false);
  protected readonly error = signal('');

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
}
