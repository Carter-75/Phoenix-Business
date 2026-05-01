import { Directive, ElementRef, Input, AfterViewInit, OnDestroy, inject } from '@angular/core';
import gsap from 'gsap';

@Directive({
  selector: '[scrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements AfterViewInit, OnDestroy {
  @Input() srY = 40;
  @Input() srX = 0;
  @Input() srDelay = 0;
  @Input() srDuration = 0.75;

  private el = inject(ElementRef<HTMLElement>);
  private observer!: IntersectionObserver;

  ngAfterViewInit() {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.set(this.el.nativeElement, { opacity: 0, y: this.srY, x: this.srX });

    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        gsap.to(this.el.nativeElement, {
          opacity: 1,
          y: 0,
          x: 0,
          duration: this.srDuration,
          delay: this.srDelay,
          ease: 'power3.out',
          onComplete: () => gsap.set(this.el.nativeElement, { clearProps: 'y,x' })
        });
        this.observer.unobserve(this.el.nativeElement);
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
