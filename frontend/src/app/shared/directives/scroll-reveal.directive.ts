import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input('y') srY = 40;
  @Input('x') srX = 0;
  @Input('delay') srDelay = 0;
  @Input('duration') srDuration = 1.2;

  private el = inject(ElementRef<HTMLElement>);
  private observer!: IntersectionObserver;

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.set(this.el.nativeElement, { opacity: 0, y: this.srY, x: this.srX });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          this.reveal();
          this.observer.unobserve(this.el.nativeElement);
        }
      },
      { threshold: 0.01, rootMargin: '0px 0px -10% 0px' }
    );

    this.observer.observe(this.el.nativeElement);

    // Safety fallback
    setTimeout(() => {
      if (gsap.getProperty(this.el.nativeElement, 'opacity') === 0) {
        this.reveal();
      }
    }, 2000);
  }

  private reveal() {
    gsap.to(this.el.nativeElement, {
      opacity: 1,
      y: 0,
      x: 0,
      duration: this.srDuration,
      delay: this.srDelay,
      ease: 'power3.out',
      onComplete: () => gsap.set(this.el.nativeElement, { clearProps: 'y,x' })
    });
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
