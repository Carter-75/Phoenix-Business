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
    {
      name: 'Artisan Ice Cream', 
      type: 'E-commerce & Brand', 
      url: 'https://example1-icecream.vercel.app/',
      desc: 'Custom boutique shop with smooth animations and integrated checkout.'
    },
    {
      name: 'Premium Cookies', 
      type: 'Retail Experience', 
      url: 'https://example2-cookies.vercel.app/',
      desc: 'High-performance retail site designed for maximum conversion.'
    },
    {
      name: 'Craft Coffee', 
      type: 'Subscription Model', 
      url: 'https://example3-coffee.vercel.app/',
      desc: 'Recurring revenue platform with customer management portal.'
    }
  ];

  testimonials = [
    {
      text: "We needed a site that didn't just look good but actually handled our traffic during launches. Phoenix delivered a rock-solid platform that has significantly increased our sales conversion rate.", 
      author: 'Elena Vance', 
      role: 'Head of Growth at Artisan Boutique'
    },
    {
      text: 'Working with Phoenix was the best decision for our rebranding. The technical precision and attention to detail they brought to our subscription platform is unmatched in the industry.', 
      author: 'Marcus Thorne', 
      role: 'CTO, OmniStream Technologies'
    }
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

