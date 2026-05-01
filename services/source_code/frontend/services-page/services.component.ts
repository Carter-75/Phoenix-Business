import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Meta } from '@angular/platform-browser';
import { SeoService } from '../services/seo.service';
import { RouterLink } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-services',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, ScrollRevealDirective],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './services.component.html',
  styles: []
})
export class ServicesComponent implements OnInit {
  private meta       = inject(Meta);
  private seo        = inject(SeoService);
  private doc        = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private http       = inject(HttpClient);

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

  get isStripeConfigured(): boolean {
    const configured = !!this.stripePublishableKey && this.stripePublishableKey.startsWith('pk_');
    return configured;
  }

  loadSubscriptions(email: string) {
    this.http.get<{subscriptions: any}>(`${environment.apiUrl}/stripe/subscriptions/${email}`)
      .subscribe({
        next: (res) => {
          this.subscriptionsByTier.set(res.subscriptions);
        },
        error: (err) => {
          console.warn('Could not load subscriptions for email:', email);
        }
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
          // Save email for session persistence
          localStorage.setItem('member_email', email);
          this.memberSessionEmail.set(email);
          this.loadSubscriptions(email);
          
          // Redirect to portal for full management
          window.location.href = res.url;
        },
        error: (err) => {
          this.portalLoading.set(false);
          this.portalError.set(err.error?.error || 'Could not find an active subscription for this email.');
        }
      });
  }

  onLogout() {
    localStorage.removeItem('member_email');
    this.memberSessionEmail.set(null);
    this.subscriptionsByTier.set({ simple: [], essential: [], professional: [] });
  }


  readonly tiers = [
    {
      id: 'simple',
      title: 'Simple Launch',
      cost: '350',
      setup: null,
      description: 'A solid foundation for your online presence. Perfect for simple, high-impact landing pages.',
      checkoutUrl: 'https://buy.stripe.com/dRm5kEeii6SUbUegN08so04',
      features: ['Single Page Website', 'Responsive Engineering', 'Initial SEO Setup', 'Contact Form Integration'],
      featured: false
    },
    {
      id: 'essential',
      title: 'Essential Care',
      cost: '99',
      setup: '250',
      description: 'Peace of mind with ongoing support and maintenance. We keep your business running smoothly.',
      checkoutUrl: 'https://buy.stripe.com/cNifZia226SUbUe0O28so05',
      features: ['30-Day Subscription Trial', 'Hosting & Domain Mgmt', 'Edits & Updates on Demand', '24/7 Uptime Monitoring', 'Backups & Security', 'Google Business Management'],
      featured: true
    },
    {
      id: 'professional',
      title: 'Professional Growth',
      cost: '149',
      setup: '500',
      description: 'Scaling your revenue through data-driven improvements and intelligent automation.',
      checkoutUrl: 'https://buy.stripe.com/6oU7sM0rs0uw1fAaoC8so06',
      features: ['30-Day Subscription Trial', 'SEO Improvements', 'Lead Capture Optimization', 'Monthly Analytics Reports', 'AI Chatbot Upkeep', 'Ad Landing Page Testing', 'Appointment Integrations'],
      featured: false
    }
  ];

  getStagger(i: number): number {
    return i * 0.12;
  }

  ngOnInit() {
    // Check for existing member session
    const savedEmail = localStorage.getItem('member_email');
    if (savedEmail) {
      this.memberSessionEmail.set(savedEmail);
      this.loadSubscriptions(savedEmail);
    }

    this.seo.updateMeta(
      'Care Plans & Growth Packages — Carter Moyer',
      'Scalable web maintenance and growth plans by Carter Moyer. From $99/mo Essential Care to $149/mo Professional suites.'
    );
    this.seo.setCanonicalUrl('https://www.carter-portfolio.fyi/services');
    
    this.meta.updateTag({ property: 'og:title', content: 'Care Plans & Growth Packages — Carter Moyer' });
    this.meta.updateTag({ property: 'og:description', content: 'Transition from one-time builds to high-value recurring growth. Maintenance, SEO, and AI automation suites tailored for modern enterprise demands.' });
    this.meta.updateTag({ property: 'og:image', content: 'https://www.carter-portfolio.fyi/images/og-image.jpg' });
    this.meta.updateTag({ property: 'og:image:width', content: '1200' });
    this.meta.updateTag({ property: 'og:image:height', content: '630' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:image', content: 'https://www.carter-portfolio.fyi/images/og-image.jpg' });
    
    if (!this.isStripeConfigured) {
      console.error('[Stripe Config Error]: stripePublishableKey is not set up yet. Checkout is currently in testing/development mode.');
    }

    this.injectJsonLd();
  }


  private injectJsonLd() {
    const script = this.doc.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Service',
      provider: {
        '@type': 'Person',
        name: 'Carter Moyer',
        url: 'https://www.carter-portfolio.fyi'
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Web Maintenance & Growth Services',
        itemListElement: [
          { '@type': 'Offer', name: 'Simple Launch', price: '350', priceCurrency: 'USD', description: 'One-time website build for landing pages.' },
          { '@type': 'Offer', name: 'Essential Care', price: '99', priceCurrency: 'USD', description: 'Monthly maintenance, security, and updates.' },
          { '@type': 'Offer', name: 'Professional Growth', price: '149', priceCurrency: 'USD', description: 'Monthly SEO, analytics, and AI automation.' }
        ]
      }
    });
    this.doc.head.appendChild(script);
    this.destroyRef.onDestroy(() => script.remove());
  }
}
