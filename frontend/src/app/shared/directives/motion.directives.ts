import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Motion directives for the flowing-light remodel (Nov 26, 2026).
 * Both are pointer-fine only and switch themselves off entirely when the
 * user prefers reduced motion, so touch and reduced-motion visitors get a
 * calm, static page. They only write CSS variables; all visuals live in
 * styles.css (.light-card, .tilt-card).
 */

function motionAllowed(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return window.matchMedia('(pointer: fine)').matches;
}

@Directive({
  selector: '[lightTrack]',
  standalone: true
})
export class LightTrackDirective {
  private el = inject(ElementRef<HTMLElement>);

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!motionAllowed()) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.el.nativeElement.style.setProperty('--mx', `${x}%`);
    this.el.nativeElement.style.setProperty('--my', `${y}%`);
  }
}

@Directive({
  selector: '[tiltCard]',
  standalone: true
})
export class TiltCardDirective {
  private el = inject(ElementRef<HTMLElement>);
  private readonly maxDeg = 6;

  @HostListener('pointermove', ['$event'])
  onMove(event: PointerEvent): void {
    if (!motionAllowed()) return;
    const rect = this.el.nativeElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    this.el.nativeElement.style.setProperty('--ry', `${(px * this.maxDeg * 2).toFixed(2)}deg`);
    this.el.nativeElement.style.setProperty('--rx', `${(-py * this.maxDeg * 2).toFixed(2)}deg`);
  }

  @HostListener('pointerleave')
  onLeave(): void {
    this.el.nativeElement.style.setProperty('--rx', '0deg');
    this.el.nativeElement.style.setProperty('--ry', '0deg');
  }
}
