import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Content-shaped loading placeholders (YouTube-style). Shown only
 * while a page or section is fetching its data; the real content
 * replaces them in place, so the layout never jumps. Pure CSS
 * pulse, no images or extra requests.
 *
 * Variants:
 * - 'hero':  big title lines, a paragraph, and a button block
 * - 'cards': a grid of card blocks (title bar, lines, button bar)
 * - 'lines': stacked text lines of varying width
 * - 'page':  hero followed by a card grid (full-page placeholder)
 */
@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="animate-pulse" aria-hidden="true">
      <ng-container *ngIf="variant === 'hero' || variant === 'page'">
        <div class="h-3 w-40 bg-white/10 rounded mb-6"></div>
        <div class="h-10 sm:h-14 w-3/4 bg-white/10 rounded-lg mb-4"></div>
        <div class="h-10 sm:h-14 w-1/2 bg-white/10 rounded-lg mb-8"></div>
        <div class="h-4 w-2/3 bg-white/[0.07] rounded mb-3"></div>
        <div class="h-4 w-1/2 bg-white/[0.07] rounded mb-10"></div>
        <div class="h-12 w-48 bg-white/10 rounded-full"></div>
      </ng-container>

      <ng-container *ngIf="variant === 'lines'">
        <div *ngFor="let w of lineWidths" class="h-4 bg-white/[0.07] rounded mb-3" [style.width]="w"></div>
      </ng-container>

      <ng-container *ngIf="variant === 'cards' || variant === 'page'">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" [class.mt-12]="variant === 'page'">
          <div *ngFor="let c of cardSlots" class="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
            <div class="h-5 w-1/2 bg-white/10 rounded mb-4"></div>
            <div class="h-8 w-2/3 bg-white/10 rounded mb-5"></div>
            <div class="h-3 w-full bg-white/[0.07] rounded mb-2.5"></div>
            <div class="h-3 w-5/6 bg-white/[0.07] rounded mb-2.5"></div>
            <div class="h-3 w-4/6 bg-white/[0.07] rounded mb-6"></div>
            <div class="h-10 w-full bg-white/10 rounded-lg"></div>
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="variant === 'table'">
        <div *ngFor="let r of cardSlots" class="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-3">
          <div class="flex-1">
            <div class="h-4 w-1/3 bg-white/10 rounded mb-2"></div>
            <div class="h-3 w-1/2 bg-white/[0.07] rounded"></div>
          </div>
          <div class="h-8 w-24 bg-white/10 rounded-lg"></div>
        </div>
      </ng-container>
    </div>
  `
})
export class SkeletonComponent {
  @Input() variant: 'hero' | 'cards' | 'lines' | 'page' | 'table' = 'lines';
  @Input() count = 3;

  get cardSlots(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  get lineWidths(): string[] {
    const widths = ['92%', '78%', '85%', '64%', '71%', '88%', '57%', '80%'];
    return widths.slice(0, Math.max(1, Math.min(this.count, widths.length)));
  }
}
