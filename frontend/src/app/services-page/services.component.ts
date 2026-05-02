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
  checkoutUrl: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScrollRevealDirective, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './services.component.html'
})
export class ServicesComponent implements OnInit {
  private meta = inject(Meta);
  private seo = inject(SeoService);
  private doc = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);
  private http = inject(HttpClient);
  public api = inject(ApiService);

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

  // New Form State (Regular properties for [(ngModel)] binding)
  firstName = '';
  lastName = '';
  userEmail = '';
  userPassword = ''; // Added for email login in modal
  acceptedTerms = false;
  acceptedPrivacy = false;
  acceptedRefunds = false;
  
  checkoutLoading = signal(false);
  modalStep = signal<'auth' | 'onboarding'>('auth');
  authError = signal<string | null>(null);
  isNewUser = false; // Memory-only flag for email signups

  constructor() {}

  isFormValid() {
    const isNameValid = this.firstName.length > 0 && this.lastName.length > 0;
    const isEmailValid = this.api.currentUser() || (this.userEmail.includes('@') && this.userEmail.length > 5);
    const policiesAccepted = this.acceptedTerms && this.acceptedPrivacy && this.acceptedRefunds;
    return isNameValid && isEmailValid && policiesAccepted;
  }

  readonly tiers: ServiceTier[] = [
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
      features: ['30-Day Subscription Trial', 'Hosting & Domain Management', 'SEO Improvements', 'Lead Capture Optimization', 'Monthly Analytics Reports', 'AI Chatbot Upkeep', 'Ad Landing Page Testing', 'Appointment Integrations'],
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

    // Handle return from Google Login / Resume flow
    this.api.checkStatus().subscribe(user => {
      const savedTierId = localStorage.getItem('checkout_tier');
      if (savedTierId) {
        const tier = this.tiers.find(t => t.id === savedTierId);
        if (tier) {
          // Always open the modal if we have an intent
          this.selectedTier.set(tier);
          this.showContract.set(true);
          
          // If logged in, go to onboarding. If not, go to auth.
          this.modalStep.set(user ? 'onboarding' : 'auth');
          
          // Pre-fill names if user exists
          if (user) {
            this.firstName = user.firstName || '';
            this.lastName = user.lastName || '';
          }
        }
        localStorage.removeItem('checkout_tier');
      }
    });

    this.seo.updateMeta(
      'Care Plans & Growth Packages — Phoenix',
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
    
    if (this.api.currentUser()) {
      this.modalStep.set('onboarding');
    } else {
      this.modalStep.set('auth');
    }
  }

  closeContract() {
    this.showContract.set(false);
    this.selectedTier.set(null);
    this.hasAccepted = false;
    localStorage.removeItem('checkout_tier');
  }

  proceedToCheckout() {
    if (!this.isFormValid() || !this.selectedTier()) return;
    const tier = this.selectedTier()!;
    this.checkoutLoading.set(true);

    const payload = {
      firstName: this.firstName,
      lastName: this.lastName,
      acceptedTerms: this.acceptedTerms,
      acceptedPrivacy: this.acceptedPrivacy,
      acceptedRefunds: this.acceptedRefunds,
      email: this.userEmail,
      password: this.userPassword // Only used if isNewUser
    };

    // If it's a completely new email user, we register them now
    if (this.isNewUser && !this.api.currentUser()) {
      this.api.post('auth/register', {
        ...payload,
        email: this.userEmail,
        password: this.userPassword
      }).subscribe({
        next: (user) => {
          this.api.currentUser.set(user);
          this.triggerStripe(tier);
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          this.authError.set('Account creation failed. Please try again.');
        }
      });
    } else {
      // Existing user or Google Pending user
      this.api.post('auth/finalize-onboarding', payload).subscribe({
        next: (user) => {
          this.api.currentUser.set(user);
          this.triggerStripe(tier);
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          console.error('Onboarding error:', err);
          alert('Failed to save your profile. Please try again.');
        }
      });
    }
  }

  private triggerStripe(tier: ServiceTier) {
    const payload = {
      tier: tier.id,
      email: this.api.currentUser()?.email,
      name: `${this.firstName} ${this.lastName}`,
      acceptedContract: true,
      contractTimestamp: new Date().toISOString(),
      projectType: tier.title
    };

    this.http.post<{url: string}>(`${environment.apiUrl}/stripe/checkout`, payload).subscribe({
      next: (res) => {
        // OPEN IN NEW TAB as requested
        window.open(res.url, '_blank');
        this.checkoutLoading.set(false);
        this.closeContract();
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        console.error('Stripe error:', err);
        alert('Failed to initialize secure payment session.');
      }
    });
  }

  loginWithGoogle() {
    if (this.selectedTier()) {
      localStorage.setItem('checkout_tier', this.selectedTier()!.id);
    }
    this.api.loginWithGoogle('/services');
  }

  onEmailAuth() {
    if (!this.userEmail || !this.userPassword) {
      this.authError.set('Email and password required.');
      return;
    }
    this.authError.set(null);
    
    // Attempt Login
    this.api.login({ email: this.userEmail, password: this.userPassword }).subscribe({
      next: () => {
        this.isNewUser = false;
        this.modalStep.set('onboarding');
      },
      error: (err) => {
        // 404 means the user doesn't exist -> Go to onboarding
        if (err.status === 404) {
          this.isNewUser = true;
          this.modalStep.set('onboarding');
        } 
        // 401 means password was actually wrong
        else if (err.status === 401) {
          this.authError.set('Incorrect password for this account.');
        } else {
          // Fallback for other errors
          this.authError.set('Something went wrong. Please try again.');
        }
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
      provider: { '@type': 'Organization', name: 'Phoenix' },
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
