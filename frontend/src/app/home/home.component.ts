import { Component, signal, inject, OnInit, afterNextRender, OnDestroy } from '@angular/core';
import { ApiService } from '../services/api.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  
  leadEmail = '';
  leadLoading = signal(false);
  leadFeedback = signal<string | null>(null);

  constructor() {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  ngOnInit() {
    // Health check
    this.api.get('health').subscribe({
      error: () => console.log('Connecting...')
    });
  }

  captureLead() {
    if (!this.leadEmail) return;
    this.leadLoading.set(true);
    this.leadFeedback.set(null);
    this.api.post('leads/capture', { email: this.leadEmail, guideType: 'Audit Request' }).subscribe({
      next: () => {
        this.leadLoading.set(false);
        this.leadEmail = '';
        this.leadFeedback.set('Audit request received.');
        setTimeout(() => this.leadFeedback.set(null), 5000);
      },
      error: (err) => {
        this.leadLoading.set(false);
        this.leadFeedback.set('Error. Please try again.');
      }
    });
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private initAnimations() {
    gsap.from('.reveal-text', {
      y: 100,
      opacity: 0,
      duration: 2,
      ease: 'power4.out',
      stagger: 0.2
    });

    gsap.from('.about-section', {
      opacity: 0,
      y: 50,
      duration: 1.5,
      scrollTrigger: {
        trigger: '.about-section',
        start: 'top 80%'
      }
    });
  }
}
