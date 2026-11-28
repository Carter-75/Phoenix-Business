import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { loadProton } from '../animation/anim-loader';

// Ember background: a fixed full-screen canvas behind every page
// (z-index -50), driven by the vendored Proton particle engine. Embers
// in the brand oranges rise slowly from just below the bottom edge,
// fade in and out across their life, and drift gently sideways. On
// fine pointers they also lean away from the cursor (Proton Repulsion
// pointed at a shared vector the pointermove handler keeps current).
// Under prefers-reduced-motion nothing starts at all and the page
// keeps the plain obsidian host background. If the vendored engine
// fails to load, the background simply stays plain.
@Component({
  selector: 'app-background-animation',
  standalone: true,
  template: `<canvas #bgCanvas id="bg-canvas"></canvas>`,
  styles: [`
    :host {
      display: block;
      position: fixed;
      inset: 0;
      z-index: -50;
      background: #020205;
      pointer-events: none;
    }
    #bg-canvas {
      width: 100%;
      height: 100%;
    }
  `]
})
export class BackgroundAnimationComponent implements OnInit, OnDestroy {
  @ViewChild('bgCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private ngZone = inject(NgZone);

  private protonLib: any = null;
  private proton: any = null;
  private emitter: any = null;
  private positionInit: any = null;
  private pointer: any = null;
  private rafId = 0;
  private running = false;
  private destroyed = false;

  // Particle cap and emission rate follow the width class: fewer,
  // slower embers on narrow (phone) screens.
  private cap = 90;
  private rateMin = 2;
  private rateMax = 3;

  private readonly onResize = () => this.handleResize();
  private readonly onVisibilityChange = () => this.handleVisibility();
  private readonly onPointerMove = (event: PointerEvent) => {
    if (this.pointer) {
      this.pointer.x = event.clientX;
      this.pointer.y = event.clientY;
    }
  };

  ngOnInit() {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.ngZone.runOutsideAngular(() => {
      void this.init();
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    try {
      this.emitter?.destroy?.();
    } catch {
      // Best effort teardown; the canvas leaves the DOM with the component.
    }
    this.emitter = null;
    this.proton = null;
  }

  private async init() {
    let Proton: any;
    try {
      Proton = await loadProton();
    } catch {
      return;
    }
    if (this.destroyed) return;
    this.protonLib = Proton;

    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    this.applyWidthClass(width);

    this.proton = new Proton();
    this.proton.addRenderer(new Proton.CanvasRenderer(canvas));

    this.emitter = new Proton.Emitter();
    this.emitter.rate = new Proton.Rate(
      new Proton.Span(this.rateMin, this.rateMax),
      new Proton.Span(0.3, 0.55)
    );

    // The prefill spawns across the whole screen; afterwards the zone
    // moves to a strip just below the bottom edge for the steady flow.
    this.positionInit = new Proton.Position(new Proton.RectZone(0, 0, width, height));
    this.emitter.addInitialize(this.positionInit);
    this.emitter.addInitialize(new Proton.Life(6, 12));
    this.emitter.addInitialize(new Proton.Radius(1, 2.6));
    // Proton velocity units are hundreds of px per second: this is a
    // rise of 16 to 34 px/s with a sideways drift of up to 5 px/s.
    this.emitter.addInitialize(new Proton.Velocity(new Proton.Span(-0.05, 0.05), new Proton.Span(-0.34, -0.16)));

    this.emitter.addBehaviour(new Proton.Color(['#FF4D00', '#EA580C', '#DC2626']));
    this.emitter.addBehaviour(this.createFadeBehaviour(Proton));
    this.emitter.addBehaviour(new Proton.RandomDrift(9, 3, 0.45));

    if (window.matchMedia('(pointer: fine)').matches) {
      // Starts far off screen; the pointermove handler keeps it current.
      this.pointer = new Proton.Vector2D(-9999, -9999);
      this.emitter.addBehaviour(new Proton.Repulsion(this.pointer, 0.9, 150));
      window.addEventListener('pointermove', this.onPointerMove, { passive: true });
    }

    this.proton.addEmitter(this.emitter);

    // Prefill so the first paint already has embers at every height.
    // Each prefilled particle gets a random age so the field does not
    // fade in or die off in one synchronized pulse.
    const prefill = Math.floor(this.cap * 0.6);
    for (let i = 0; i < prefill; i++) {
      const particle = this.emitter.createParticle();
      if (particle && particle.life) {
        particle.age = Math.random() * particle.life * 0.85;
      }
    }
    this.positionInit.zone = new this.protonLib.RectZone(-10, height + 6, width + 20, 14);

    this.emitter.emit();
    this.running = true;
    this.loop();
    window.addEventListener('resize', this.onResize);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  // Alpha follows a sine arc over each particle's life: fade in, peak
  // at mid-life, fade out. A plain Proton.Behaviour instance with an
  // overridden applyBehaviour; the base class supplies the lifecycle
  // hooks the emitter calls.
  private createFadeBehaviour(Proton: any): any {
    const behaviour = new Proton.Behaviour();
    behaviour.applyBehaviour = (particle: any) => {
      if (!particle.life) return;
      const t = Math.min(1, Math.max(0, particle.age / particle.life));
      particle.alpha = Math.sin(Math.PI * t) * 0.75;
    };
    return behaviour;
  }

  private loop = () => {
    if (this.destroyed || !this.running) return;
    // Enforce the cap: hold emission at zero while the field is full,
    // restore the normal rate once particles have died off.
    const numPan = this.emitter.rate.numPan;
    if (this.emitter.particles.length >= this.cap) {
      numPan.a = 0;
      numPan.b = 0;
    } else if (numPan.b === 0) {
      numPan.a = this.rateMin;
      numPan.b = this.rateMax;
    }
    this.proton.update();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private applyWidthClass(width: number) {
    if (width < 640) {
      this.cap = 40;
      this.rateMin = 1;
      this.rateMax = 2;
    } else {
      this.cap = 90;
      this.rateMin = 2;
      this.rateMax = 3;
    }
  }

  private handleResize() {
    if (!this.emitter || !this.positionInit) return;
    const canvas = this.canvasRef.nativeElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    this.applyWidthClass(width);
    this.positionInit.zone = new this.protonLib.RectZone(-10, height + 6, width + 20, 14);
  }

  private handleVisibility() {
    if (this.destroyed || !this.proton) return;
    if (document.hidden) {
      this.running = false;
      if (this.rafId) cancelAnimationFrame(this.rafId);
    } else if (!this.running) {
      this.running = true;
      this.loop();
    }
  }
}
