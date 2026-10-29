import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

/**
 * Slim deal band shown while a group buy event is open: the event name,
 * the honest joined count, the deadline, and the join terms, linking to
 * the group buy page. Renders nothing when no event is open, so pages
 * never advertise a deal that is not actually running.
 */
@Component({
  selector: 'app-group-buy-strip',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section *ngIf="event() as ev" class="bg-orange-600/[0.07] border-y border-orange-500/20">
      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-5 text-center">
        <span class="text-xs sm:text-sm text-white/80">
          <i class="fa-solid fa-fire text-orange-500 mr-2"></i>
          <strong class="text-white uppercase tracking-wide">{{ ev.name }}</strong>
          &nbsp;{{ ev.joinedCount }} of {{ ev.slotsNeeded }} joined. Closes {{ deadlineText(ev) }}.
          Join for {{ money(ev.joinPriceCents) }}, charged only if the group fills.
        </span>
        <a routerLink="/group-buy" class="text-[11px] font-black uppercase tracking-[0.25em] text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap">See the group buy &rarr;</a>
      </div>
    </section>
  `
})
export class GroupBuyStripComponent implements OnInit {
  private api = inject(ApiService);
  event = signal<any>(null);

  ngOnInit() {
    this.api.get<any>('group-buy/current').subscribe({
      next: (r) => {
        const ev = r && r.event ? r.event : null;
        if (ev && (ev.status === 'open' || ev.status === 'filling')) this.event.set(ev);
      },
      error: () => this.event.set(null)
    });
  }

  money(cents: number): string {
    return '$' + (Math.max(0, cents || 0) / 100).toFixed(2);
  }

  deadlineText(ev: any): string {
    try {
      return new Date(ev.deadline).toLocaleString('en-US', {
        timeZone: 'America/Chicago',
        weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
      });
    } catch {
      return '';
    }
  }
}
