import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { SeoService } from '../services/seo.service';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';

import { SafePipe } from '../shared/pipes/safe.pipe';

interface ServiceTier {
  id: string;
  title: string;
  description: string;
  cost: string;
  setup: string | null;
  features: string[];
  featured?: boolean;
}

@Component({
  selector: 'app-services',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ScrollRevealDirective, FormsModule, SafePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './services.component.html'
})
export class ServicesComponent implements OnInit {
  private meta = inject(Meta);
  private seo = inject(SeoService);
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  private api = inject(ApiService);

  readonly stripePublishableKey = environment.stripePublishableKey;
  
  // Subscription Management State
  portalLoading = signal(false);
  portalError = signal<string | null>(null);
  memberSessionEmail = signal<string | null>(null);
  subscriptionsByTier = signal<Record<string, any[]>>({
    simple: [],
    essential: [],
    professional: []
  });

  // Contract State
  showContract = signal(false);
  selectedTier = signal<ServiceTier | null>(null);
  hasAccepted = false;

  readonly tiers: ServiceTier[] = [
    {
      id: 'simple',
      title: 'Simple Launch',
      cost: '350',
      setup: null,
      description: 'A solid foundation for your online presence. Perfect for simple, high-impact landing pages.',
      features: ['Single Page Website', 'Responsive Engineering', 'Initial SEO Setup', 'Contact Form Integration'],
      featured: false
    },
    {
      id: 'essential',
      title: 'Essential Care',
      cost: '99',
      setup: '250',
      description: 'Peace of mind with ongoing support and maintenance. We keep your business running smoothly.',
      features: ['30-Day Subscription Trial', 'Hosting & Domain Mgmt', 'Edits & Updates on Demand', '24/7 Uptime Monitoring', 'Backups & Security', 'Google Business Management'],
      featured: true
    },
    {
      id: 'professional',
      title: 'Professional Growth',
      cost: '149',
      setup: '500',
      description: 'Scaling your revenue through data-driven improvements and intelligent automation.',
      features: ['30-Day Subscription Trial', 'SEO Improvements', 'Lead Capture Optimization', 'Monthly Analytics Reports', 'AI Chatbot Upkeep', 'Ad Landing Page Testing', 'Appointment Integrations'],
      featured: false
    }
  ];

  ngOnInit() {
    // Check for existing member session
    const savedEmail = localStorage.getItem('member_email');
    if (savedEmail) {
      this.memberSessionEmail.set(savedEmail);
      this.loadSubscriptions(savedEmail);
    }

    this.seo.updateMeta(
      'Care Plans & Growth Packages — Phoenix Business',
      'Scalable web maintenance and growth plans. From $99/mo Essential Care to $149/mo Professional suites.'
    );
    
    this.injectJsonLd();
  }

  loadSubscriptions(email: string) {
    this.http.get<{subscriptions: any}>(`${environment.apiUrl}/stripe/subscriptions/${email}`)
      .subscribe({
        next: (res) => this.subscriptionsByTier.set(res.subscriptions),
        error: (err) => console.warn('Could not load subscriptions for email:', email)
      });
  }

  onManageSubscription(email: string) {
    if (!email || !email.includes('@')) {
      this.portalError.set('Please enter a valid email address.');
      return;
    }
    this.portalLoading.set(true);
    this.portalError.set(null);
    this.http.post<{url: string}>(`${environment.apiUrl}/stripe/create-portal-session`, { email })
      .subscribe({
        next: (res) => {
          localStorage.setItem('member_email', email);
          this.memberSessionEmail.set(email);
          window.location.href = res.url;
        },
        error: (err) => {
          this.portalLoading.set(false);
          this.portalError.set(err.error?.error || 'Could not find an active subscription.');
        }
      });
  }

  onLogout() {
    localStorage.removeItem('member_email');
    this.memberSessionEmail.set(null);
    this.subscriptionsByTier.set({ simple: [], essential: [], professional: [] });
  }

  openContract(tier: ServiceTier) {
    this.selectedTier.set(tier);
    this.showContract.set(true);
  }

  closeContract() {
    this.showContract.set(false);
    this.selectedTier.set(null);
    this.hasAccepted = false;
  }

  proceedToCheckout() {
    if (!this.hasAccepted || !this.selectedTier()) return;
    const tier = this.selectedTier()!;
    
    this.api.post('stripe/checkout', {
      tier: tier.id,
      acceptedContract: true,
      contractTimestamp: new Date().toISOString()
    }).subscribe({
      next: (res: any) => {
        if (res.url) window.location.href = res.url;
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        alert('Could not initiate checkout. Please try again.');
      }
    });
  }

  getStagger(i: number): number {
    return i * 0.1;
  }

  private injectJsonLd() {
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      provider: { '@type': 'Organization', name: 'Phoenix Business' },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Web Maintenance & Growth Services',
        itemListElement: [
          { '@type': 'Offer', name: 'Simple Launch', price: '350', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Essential Care', price: '99', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Professional Growth', price: '149', priceCurrency: 'USD' }
        ]
      }
    });
    this.doc.head.appendChild(script);
    this.destroyRef.onDestroy(() => script.remove());
  }
}
