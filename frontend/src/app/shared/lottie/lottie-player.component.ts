import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { loadLottie } from '../animation/anim-loader';

// Thin wrapper around the vendored lottie player. The parent controls
// the rendered size through its own classes or inline styles on this
// element; the player fills the host. Under prefers-reduced-motion the
// component renders nothing at all. The animation is destroyed on
// teardown so looping players never outlive their page.
@Component({
  selector: 'app-lottie-player',
  standalone: true,
  template: `<div #container class="lottie-host"></div>`,
  styles: [`
    :host {
      display: inline-block;
    }
    .lottie-host {
      width: 100%;
      height: 100%;
    }
    .lottie-host svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class LottiePlayerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) src = '';
  @Input() loop = false;
  @Input() autoplay = true;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private animation: any = null;
  private destroyed = false;

  ngOnInit() {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    void this.init();
  }

  ngOnDestroy() {
    this.destroyed = true;
    try {
      this.animation?.destroy?.();
    } catch {
      // Best effort; the host element leaves the DOM with the component.
    }
    this.animation = null;
  }

  private async init() {
    let lottie: any;
    try {
      lottie = await loadLottie();
    } catch {
      return;
    }
    if (this.destroyed || !this.src) return;
    this.animation = lottie.loadAnimation({
      container: this.containerRef.nativeElement,
      renderer: 'svg',
      loop: this.loop,
      autoplay: this.autoplay,
      path: this.src
    });
  }
}
