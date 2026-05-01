import { Component, signal, inject, OnInit, viewChild, ElementRef, afterNextRender, OnDestroy } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as Matter from 'matter-js';
import anime from 'animejs';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  
  leadEmail = '';
  leadLoading = signal(false);
  leadFeedback = signal<string | null>(null);
  private scene = viewChild<ElementRef<HTMLDivElement>>('scene');
  private engine?: Matter.Engine;
  private render?: Matter.Render;
  private runner?: Matter.Runner;

  constructor() {
    afterNextRender(() => {
      this.initPhysics();
      this.initAnimations();
      window.addEventListener('resize', this.handleResize);
    });
  }

  ngOnInit() {
    // Health check
    this.api.get('health').subscribe({
      error: () => console.log('Backend offline or connecting...')
    });
  }

  captureLead() {
    if (!this.leadEmail) return;
    this.leadLoading.set(true);
    this.leadFeedback.set(null);
    this.api.post('leads/capture', { email: this.leadEmail, guideType: 'AI Blueprint' }).subscribe({
      next: () => {
        this.leadLoading.set(false);
        this.leadEmail = '';
        this.leadFeedback.set('Blueprint sent to your inbox!');
        setTimeout(() => this.leadFeedback.set(null), 5000);
      },
      error: (err) => {
        this.leadLoading.set(false);
        this.leadFeedback.set('Request failed. Check email or try again later.');
        console.error('[LEAD CAPTURE ERROR]:', err);
      }
    });
  }

  ngOnDestroy() {
    window.removeEventListener('resize', this.handleResize);
    if (this.runner) Matter.Runner.stop(this.runner);
    if (this.render) {
      Matter.Render.stop(this.render);
      if (this.render.canvas.parentNode) {
        this.render.canvas.parentNode.removeChild(this.render.canvas);
      }
    }
    if (this.engine) Matter.Engine.clear(this.engine);
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private handleResize = () => {
    const el = this.scene()?.nativeElement;
    if (el && this.render) {
      this.render.canvas.width = el.clientWidth;
      this.render.canvas.height = el.clientHeight;
      this.render.options.width = el.clientWidth;
      this.render.options.height = el.clientHeight;
    }
  };

  private initPhysics() {
    const el = this.scene()?.nativeElement;
    if (!el) return;

    const width = el.clientWidth;
    const height = el.clientHeight;

    this.engine = Matter.Engine.create();
    this.engine.gravity.y = -0.05; // Embers float UP

    this.render = Matter.Render.create({
      element: el,
      engine: this.engine,
      options: {
        width: width,
        height: height,
        background: 'transparent',
        wireframes: false
      }
    });

    // Create floating embers
    const embers: Matter.Body[] = [];
    for (let i = 0; i < 40; i++) {
      const radius = Matter.Common.random(2, 8);
      const ember = Matter.Bodies.circle(
        Matter.Common.random(0, width),
        Matter.Common.random(height, height + 500),
        radius,
        {
          frictionAir: 0.05,
          restitution: 0.9,
          render: {
            fillStyle: Matter.Common.choose(['#f97316', '#ef4444', '#7c3aed', '#fb923c']),
            opacity: Matter.Common.random(0.2, 0.6)
          }
        }
      );
      embers.push(ember);
    }

    // Walls (invisible) to keep embers in view horizontally
    const leftWall = Matter.Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(width + 10, height / 2, 20, height, { isStatic: true });
    const topWall = Matter.Bodies.rectangle(width / 2, -500, width, 20, { isStatic: true });

    Matter.World.add(this.engine.world, [...embers, leftWall, rightWall, topWall]);

    // Mouse constraint
    const mouse = Matter.Mouse.create(this.render.canvas);
    const mouseConstraint = Matter.MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false }
      }
    });

    Matter.World.add(this.engine.world, mouseConstraint);

    // Continuous reset for embers that float off top
    Matter.Events.on(this.engine, 'afterUpdate', () => {
      embers.forEach(ember => {
        if (ember.position.y < -100) {
          Matter.Body.setPosition(ember, {
            x: Matter.Common.random(0, width),
            y: height + Matter.Common.random(100, 300)
          });
        }
      });
    });

    this.runner = Matter.Runner.create();
    Matter.Runner.run(this.runner, this.engine);
    Matter.Render.run(this.render);
  }

  private initAnimations() {
    // Reveal h1 and p
    gsap.from('h1, p', {
      y: 50,
      opacity: 0,
      duration: 1.5,
      ease: 'power4.out',
      stagger: 0.2
    });

    // Bento grid reveal
    gsap.from('.premium-card', {
      y: 100,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: '.grid',
        start: 'top 85%'
      }
    });

    // Hover effect for premium cards (micro-animations)
    const cards = document.querySelectorAll('.premium-card');
    cards.forEach(card => {
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { scale: 1.02, duration: 0.5, ease: 'power2.out' });
      });
      card.addEventListener('mouseleave', () => {
        gsap.to(card, { scale: 1, duration: 0.5, ease: 'power2.out' });
      });
    });
  }
}
