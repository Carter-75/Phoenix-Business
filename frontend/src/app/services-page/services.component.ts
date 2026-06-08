import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { SeoService } from '../services/seo.service';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { environment } from '../../environments/environment';
import { ApiService } from '../services/api.service';
import { SafePipe } from '../shared/pipes/safe.pipe';

interface ServiceTier {
  id: string;
  title: string;
  description: string;
  cost: string | null;
  baseCost?: string | null;
  setup: string | null;
  baseSetup?: string | null;
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  public api = inject(ApiService);

  readonly stripePublishableKey = environment.stripePublishableKey;
  
  // Subscription Management State
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
  businessName = '';
  userEmail = '';
  userPassword = ''; // Added for email login in modal
  acceptedTerms = false;
  
  readonly TERMS_VERSION_TEXT = "I agree to the Terms of Service, Privacy Policy, and Refund Policy. I acknowledge that all Subscription Tiers (Tiers 1, 2 & 3) require a mandatory 12-month commitment and include a non-refundable setup fee as detailed in the Terms. I also agree to allowlist hello@phoenixwebsites.ai and partnership@carter-portfolio.fyi to ensure important emails do not go to spam.";
  
  checkoutLoading = signal(false);
  modalStep = signal<'auth' | 'onboarding'>('auth');
  authError = signal<string | null>(null);
  isNewUser = false; // Memory-only flag for email signups

  constructor() {}

  isFormValid() {
    const isNameValid = this.firstName.length > 0 && this.lastName.length > 0;
    const isBusinessValid = this.businessName.length > 0;
    const isEmailValid = this.api.currentUser() || (this.userEmail.includes('@') && this.userEmail.length > 5);
    const policiesAccepted = this.acceptedTerms;
    return isNameValid && isBusinessValid && isEmailValid && policiesAccepted;
  }

  readonly discountPercentage = signal(0);

  tiers = signal<ServiceTier[]>([
    {
      id: 'simple',
      title: 'Simple Launch',
      cost: '89',
      baseCost: '99',
      setup: '1349',
      baseSetup: '1499',
      description: 'The essential foundation for your business. A fully custom, lightning-fast website designed to convert visitors into clients. Includes ongoing basic maintenance and hosting, but no ongoing edits.',
      checkoutUrl: 'https://buy.stripe.com/14k7sMc6adTkg6scMN',
      features: ['Custom AI-Assisted Design', 'Mobile & SEO Optimized', 'Blazing Fast Next.js/Angular', 'High-Converting Copywriting', 'Secure & Accessible', 'Standard Contact Forms'],
      featured: false
    },
    {
      id: 'essential',
      title: 'Essential Care',
      cost: '269',
      baseCost: '299',
      setup: '3149',
      baseSetup: '3499',
      description: 'Peace of mind with ongoing support and maintenance. We keep your business running smoothly. Includes On-Demand Edits (Small content and image updates).',
      checkoutUrl: 'https://buy.stripe.com/cNifZia226SUbUe0O28so05',
      features: ['30-Day Subscription Trial', 'Hosting & Domain Mgmt', 'Edits & Updates on Demand', '24/7 Uptime Monitoring', 'Backups & Security', 'Google Business Management'],
      featured: true
    },
    {
      id: 'professional',
      title: 'Professional Growth',
      cost: '539',
      baseCost: '599',
      setup: '7199',
      baseSetup: '7999',
      description: 'Scaling your revenue through data-driven improvements and intelligent automation. Includes Priority Support & Advanced Edits (Layouts, features).',
      checkoutUrl: 'https://buy.stripe.com/6oU7sM0rs0uw1fAaoC8so06',
      features: ['30-Day Subscription Trial', 'Hosting & Domain Management', 'SEO Improvements', 'Lead Capture Optimization', 'Monthly Analytics Reports', 'AI Chatbot Upkeep', 'Ad Landing Page Testing', 'Appointment Integrations'],
      featured: false
    }
  ]);

  ngOnInit() {
    // Fetch Dynamic Pricing
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => {
        this.discountPercentage.set(data.discountPercentage || 0);
        const formatBase = (cents: number) => cents ? Math.round(cents / 100).toString() : null;
        const formatPrice = (cents: number, pct: number) => cents ? Math.round((cents / 100) * (1 - pct / 100)).toString() : null;
        
        this.tiers.update(currentTiers => currentTiers.map(t => {
          let baseCostCents = 0;
          let baseSetupCents = 0;
          if (t.id === 'simple') { baseCostCents = data.basePrices.simple_monthly; baseSetupCents = data.basePrices.simple_setup; }
          if (t.id === 'essential') { baseCostCents = data.basePrices.essential_monthly; baseSetupCents = data.basePrices.essential_setup; }
          if (t.id === 'professional') { baseCostCents = data.basePrices.professional_monthly; baseSetupCents = data.basePrices.professional_setup; }
          
          return {
            ...t,
            baseCost: formatBase(baseCostCents),
            cost: formatPrice(baseCostCents, data.discountPercentage) || t.cost,
            baseSetup: formatBase(baseSetupCents),
            setup: formatPrice(baseSetupCents, data.discountPercentage) || t.setup
          };
        }));
      },
      error: (err) => console.error('Failed to load dynamic pricing', err)
    });

    // Handle route query params for generic login
    this.route.queryParams.subscribe(params => {
      if (params['login'] === 'true' && !this.api.currentUser()) {
        this.selectedTier.set(null);
        this.showContract.set(true);
        this.modalStep.set('auth');
        // Clean up the URL so it doesn't reopen on refresh
        this.router.navigate([], { replaceUrl: true, queryParams: { login: null }, queryParamsHandling: 'merge' });
      }
    });

    // Handle return from Google Login / Resume flow
    this.api.checkStatus().subscribe(user => {
      const savedTierId = sessionStorage.getItem('checkout_tier');
      const isGenericLogin = sessionStorage.getItem('generic_login');
      
      if (savedTierId) {
        const tier = this.tiers().find(t => t.id === savedTierId);
        sessionStorage.removeItem('checkout_tier');
        if (tier) {
          if (user && user.hasFinalizedProfile) {
            // User is fully registered, go straight to Stripe
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.checkoutLoading.set(true);
            this.triggerStripe(tier);
          } else {
            // Always open the modal if we have an intent but missing profile
            this.selectedTier.set(tier);
            this.showContract.set(true);
            
            // If logged in, go to onboarding. If not, go to auth.
            this.modalStep.set(user ? 'onboarding' : 'auth');
            
            // Pre-fill fields if user exists
            if (user) {
              this.firstName = user.firstName || '';
              this.lastName = user.lastName || '';
              this.businessName = user.businessName || '';
            }
          }
        }
      } else if (isGenericLogin) {
        sessionStorage.removeItem('generic_login');
        if (user) {
          if (!user.hasFinalizedProfile) {
            this.selectedTier.set(null);
            this.showContract.set(true);
            this.modalStep.set('onboarding');
            this.firstName = user.firstName || '';
            this.lastName = user.lastName || '';
            this.businessName = user.businessName || '';
          } else {
            this.router.navigate(['/home']);
          }
        }
      }
    });

    this.seo.updateMeta(
      'Care Plans & Growth Packages — Phoenix',
      'Scalable web maintenance and growth plans. From $99/mo Essential Care to $149/mo Professional suites.'
    );
    
    this.injectJsonLd();
  }

  openContract(tier: ServiceTier) {
    const user = this.api.currentUser();
    
    if (user && user.hasFinalizedProfile) {
      // User is fully registered. Go straight to Stripe!
      this.firstName = user.firstName;
      this.lastName = user.lastName;
      this.checkoutLoading.set(true);
      this.triggerStripe(tier);
      return;
    }

    this.selectedTier.set(tier);
    this.showContract.set(true);
    
    if (user) {
      this.firstName = user.firstName || '';
      this.lastName = user.lastName || '';
      this.businessName = user.businessName || '';
      this.modalStep.set('onboarding');
    } else {
      this.modalStep.set('auth');
    }
  }

  closeContract() {
    this.showContract.set(false);
    this.selectedTier.set(null);
    this.hasAccepted = false;
    sessionStorage.removeItem('checkout_tier');
  }

  proceedToCheckout() {
    if (!this.isFormValid()) return;
    const tier = this.selectedTier();
    this.checkoutLoading.set(true);

    const payload = {
      firstName: this.firstName,
      lastName: this.lastName,
      businessName: this.businessName,
      acceptedTerms: this.acceptedTerms,
      termsAcceptedVersion: this.TERMS_VERSION_TEXT,
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
          if (tier) {
            this.triggerStripe(tier);
          } else {
            this.closeContract();
            this.router.navigate(['/home']);
          }
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
          if (tier) {
            this.triggerStripe(tier);
          } else {
            this.closeContract();
            this.router.navigate(['/home']);
          }
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
    const user = this.api.currentUser();
    const finalFirstName = user?.firstName || this.firstName;
    const finalLastName = user?.lastName || this.lastName;
    
    const payload = {
      tier: tier.id,
      email: user?.email || this.userEmail,
      name: `${finalFirstName} ${finalLastName}`.trim(),
      businessName: user?.businessName || this.businessName,
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
      sessionStorage.setItem('checkout_tier', this.selectedTier()!.id);
    } else {
      sessionStorage.setItem('generic_login', 'true');
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
        const user = this.api.currentUser();
        
        if (user && user.hasFinalizedProfile) {
          // Returning user fully registered.
          if (this.selectedTier()) {
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.checkoutLoading.set(true);
            this.triggerStripe(this.selectedTier()!);
          } else {
            this.closeContract();
            this.router.navigate(['/home']);
          }
        } else {
          // Account exists but profile is not finalized (unlikely for email, but safe fallback)
          this.modalStep.set('onboarding');
        }
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
