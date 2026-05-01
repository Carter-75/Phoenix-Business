import { Component, signal, inject, OnInit, afterNextRender, OnDestroy } from '@angular/core';
import { ApiService } from '../services/api.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../shared/pipes/safe.pipe';

gsap.registerPlugin(ScrollTrigger);

import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ScrollRevealDirective, SafePipe],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  
  submitting = signal(false);
  success = signal(false);

  clients = [
    {name: 'Artisan Ice Cream', type: 'Boutique', url: 'https://example1-icecream.vercel.app/'},
    {name: 'Premium Cookies', type: 'Retail', url: 'https://example2-cookies.vercel.app/'},
    {name: 'Craft Coffee', type: 'Subscription', url: 'https://example3-coffee.vercel.app/'}
  ];

  testimonials = [
    {text: 'The tools Phoenix built for us have completely changed how we find new customers.', author: 'Elena Vance', role: 'Growth Director'},
    {text: 'Our website is faster and more reliable than ever. A perfect partner for our tech needs.', author: 'Marcus Thorne', role: 'CTO, OmniStream'}
  ];

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

  onSubmitLead(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      businessName: formData.get('businessName'),
      message: formData.get('requirements'),
      guideType: 'Technical Audit Request'
    };

    this.submitting.set(true);
    this.api.post('leads/capture', payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
        form.reset();
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err) => {
        this.submitting.set(false);
        alert('Failed to send request. Please check your connection.');
      }
    });
  }

  scrollToAudit() {
    document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' });
  }

  ngOnDestroy() {
    ScrollTrigger.getAll().forEach(t => t.kill());
  }

  private initAnimations() {
    // Hero Reveal
    gsap.from('.hero-reveal', {
      y: 60,
      opacity: 0,
      duration: 1.5,
      ease: 'power4.out',
      stagger: 0.15,
      delay: 0.5
    });

    // Scroll Reveal Utility
    const reveals = document.querySelectorAll('[appScrollReveal]');
    reveals.forEach(el => {
      gsap.from(el, {
        y: 40,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      });
    });
  }
}

