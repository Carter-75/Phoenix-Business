import { ChangeDetectionStrategy, Component, OnInit, inject, DestroyRef, signal, effect, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  color: string;
}

import { ProjectConfiguratorComponent } from '../shared/components/configurator/configurator.component';
import { GroupBuyStripComponent } from '../shared/group-buy-strip/group-buy-strip.component';

@Component({
  selector: 'app-services',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ScrollRevealDirective, FormsModule, RouterLink, ProjectConfiguratorComponent, GroupBuyStripComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './services.component.html',
  styles: [`
    @keyframes tierEnter {
      from { opacity: 0; transform: translateY(18px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .tier-enter {
      animation: tierEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .tier-enter:hover {
      box-shadow: 0 0 50px -15px var(--tc), 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
  `]
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
  
  enterpriseProjectType = 'Custom Web Application';
  enterpriseOptions = [
    'Custom Web Application',
    'Interactive Browser Game',
    'Internal Business Tool',
    'Workflow Automation',
    'Mobile App Backend',
    'Hardware Integration',
    'AI Agent Swarm / Pipeline',
    'Data Scraping Pipeline',
    'Other / Let\'s Discuss'
  ];
  
  readonly TERMS_VERSION_TEXT = "I agree to the Terms of Service, Privacy Policy, and Refund Policy. I acknowledge that all Subscription Tiers (Tiers 1, 2, 3 & 4) require a mandatory 12-month commitment and include a non-refundable setup fee as detailed in the Terms. I also agree to allowlist hello@phoenixwebsites.ai and partnerships@carter-portfolio.fyi to ensure important emails do not go to spam. I agree to receive occasional group buy and event announcement emails, which I can stop at any time by replying UNSUBSCRIBE or using the unsubscribe link in any announcement.";
  
  checkoutLoading = signal(false);
  modalStep = signal<'auth' | 'onboarding'>('auth');
  authError = signal<string | null>(null);
  outreachRefActive = signal(false);
  first5Remaining = signal<number | null>(null);
  // Terms re-check at login: set when the backend says this account
  // must accept the updated terms before a session is created.
  loginNeedsTerms = signal(false);
  loginTermsChecked = signal(false);
  authSuccessMsg = signal<string | null>(null);
  authSubView = signal<'login' | 'forgot' | 'reset'>('login');
  forgotEmail = '';
  resetCode = '';
  newResetPassword = '';
  confirmResetPassword = '';
  resetLoading = signal(false);
  isNewUser = false; // Memory-only flag for email signups

  discountCode = signal('');
  discountError = signal<string | null>(null);
  isAnimatingDiscount = signal(false);
  appliedDiscountPercentage = signal(0);

  activeDropdownTier = signal<string | null>(null);
  cardDiscountCode = signal<string>('');
  pendingConfigIntent: any = null;

  constructor() {
    effect(() => {
      const req = this.api.authModalRequested();
      if (req && !this.api.currentUser()) {
        this.selectedTier.set(null);
        if (req.intent && req.intent.type === 'configuration') {
          this.pendingConfigIntent = req.intent.configuration;
          this.acceptedTerms = true;
        }
        this.showContract.set(true);
        this.modalStep.set('auth');
      }
    }, { allowSignalWrites: true });
  }

  onRequestAuthFromConfigurator() {
    this.selectedTier.set(null);
    const intent = this.api.peekPendingIntent();
    if (intent && intent.type === 'configuration') {
      this.pendingConfigIntent = intent.configuration;
      this.acceptedTerms = true;
    }
    const user = this.api.currentUser();
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
      title: 'Starter Launch Website',
      cost: '99',
      baseCost: '99',
      setup: '1499',
      baseSetup: '1499',
      description: 'A custom website of up to 3 pages, designed and built for your business, with managed hosting, SSL, and daily backups included. Delivered in at most 2 weeks. You will receive an email 3 weeks after purchase to rate the project.',
      features: ['30-Day Subscription Trial', 'Max 2-Week Delivery', 'Up to 3 Pages', 'Custom Design, No Templates', 'Hosting, SSL and Daily Backups', 'Mobile and SEO Optimized'],
      featured: false,
      color: '#EA580C'
    },
    {
      id: 'essential',
      title: 'Custom Business Website',
      cost: '199',
      baseCost: '199',
      setup: '2499',
      baseSetup: '2499',
      description: 'Everything in the Starter Launch Website, with up to 6 pages (services, team, portfolio), 24/7 monitoring, security updates, and 2 hours of custom edits every month. Delivered in at most 3 weeks. You will receive an email 4 weeks after purchase to rate the project.',
      features: ['30-Day Subscription Trial', 'Everything in Starter Launch', 'Max 3-Week Delivery', 'Up to 6 Pages', '2 Hours/Mo Custom Edits', 'Hosting, Monitoring and Security Updates'],
      featured: true,
      color: '#FF4D00'
    },
    {
      id: 'professional',
      title: 'E-Commerce Storefront',
      cost: '299',
      baseCost: '299',
      setup: '3499',
      baseSetup: '3499',
      description: 'Everything in the Custom Business Website, plus a full online store: product catalog, cart, and checkout through your payment provider, with catalog and checkout support and 3 hours of custom edits every month. Delivered in at most 4 weeks. You will receive an email 5 weeks after purchase to rate the project.',
      features: ['30-Day Subscription Trial', 'Everything in Custom Business', 'Max 4-Week Delivery', 'Up to 8 Pages', 'Store, Cart and Checkout Included', '3 Hours/Mo Custom Edits'],
      featured: false,
      color: '#DC2626'
    },
    {
      id: 'webapp',
      title: 'Full-Stack Web App / SaaS MVP',
      cost: '399',
      baseCost: '399',
      setup: '4999',
      baseSetup: '4999',
      description: 'A custom web application with user accounts, a database, and a client dashboard included, plus API monitoring, security patching, and 5 hours of engineering every month. Delivered in at most 5 weeks. You will receive an email 6 weeks after purchase to rate the project.',
      features: ['30-Day Subscription Trial', 'Max 5-Week Delivery', 'Up to 10 Pages or Views', 'User Accounts and Database Included', 'Client Dashboard Included', '5 Hours/Mo Engineering'],
      featured: false,
      color: '#EA580C'
    },
    {
      id: 'enterprise',
      title: 'Enterprise Custom Platform',
      cost: '999',
      baseCost: '999',
      setup: '14999',
      baseSetup: '14999',
      description: 'Fully custom enterprise architecture with multi-role permissions, a dedicated account manager, and 10 or more hours of dedicated engineering per month. Timeline varies by scope. You will receive an email to rate the project 1 week after expected completion.',
      features: ['30-Day Subscription Trial', 'Timeline Varies By Scope', 'Up to 15 Pages', 'Multi-Role Permissions', '10+ Hours/Mo Dedicated Engineering', 'Dedicated Account Manager and SLAs'],
      featured: false,
      color: '#FF4D00'
    },
    // --- Data Intelligence (One-Time, Non-Refundable, Rebuyable) ---
    {
      id: 'data',
      title: 'Data Cleanup & Organization',
      cost: null,
      baseCost: null,
      setup: null,
      baseSetup: null,
      description: 'Turn the files you already have into clear, organized information. We clean spreadsheets, standardize formats, and prepare useful reports with Microsoft tools and AI assistance. Scope and price are agreed before work starts.',
      features: ['Work On Your Own Files', 'Spreadsheet Cleanup', 'Consistent Formats', 'Duplicate Review', 'Clear Reports', 'Quote Before Work Starts'],
      featured: false,
      color: '#A1A1AA'
    }
  ]);

  ngOnInit() {
    this.seo.updateMeta({
      title: 'Website Plans & Services | Phoenix Websites AI',
      description: 'Explore custom website development, business automation, AI solutions, and data cleanup by Phoenix Websites AI. Lifetime price lock on all website tiers.',
      canonicalUrl: 'https://phoenixwebsites.ai/services',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'name': 'Website Development & Digital Services',
        'provider': {
          '@type': 'Organization',
          'name': 'Phoenix Websites AI',
          'url': 'https://phoenixwebsites.ai'
        },
        'description': 'Managed custom web development, workflow automation, AI assistants, and data cleaning.',
        'areaServed': 'US'
      }
    });

    // Outreach first-5 attribution: the outreach email links here
    // with ?ref=outreach5. Persist it so it survives the Google
    // sign-in round trip, include it in the signup payload, and show
    // the live spot count while spots remain.
    try {
      const refParam = new URLSearchParams(window.location.search).get('ref');
      if (refParam) localStorage.setItem('pw_signup_ref', refParam);
      if (localStorage.getItem('pw_signup_ref') === 'outreach5') {
        this.outreachRefActive.set(true);
        this.api.get<any>('offers/first5').subscribe({
          next: (s) => { if (s && s.success) this.first5Remaining.set(s.remaining); },
          error: () => {}
        });
      }
    } catch {}

    // Fetch Dynamic Pricing
    this.api.get<any>('stripe/pricing').subscribe({
      next: (data) => {
        this.discountPercentage.set(data.discountPercentage || 0);
        const formatBase = (cents: number) => cents ? Math.round(cents / 100).toString() : null;
        const formatPrice = (cents: number, pct: number) => cents ? (Math.round(cents * (1 - pct / 100)) / 100).toFixed(2) : null;
        
        this.tiers.update(currentTiers => currentTiers.map(t => {
          let baseCostCents = 0;
          let baseSetupCents = 0;
          if (t.id === 'simple') { baseCostCents = data.basePrices.simple_monthly; baseSetupCents = data.basePrices.simple_setup; }
          if (t.id === 'essential') { baseCostCents = data.basePrices.essential_monthly; baseSetupCents = data.basePrices.essential_setup; }
          if (t.id === 'professional') { baseCostCents = data.basePrices.professional_monthly; baseSetupCents = data.basePrices.professional_setup; }
          if (t.id === 'webapp') { baseCostCents = data.basePrices.webapp_monthly; baseSetupCents = data.basePrices.webapp_setup; }
          if (t.id === 'enterprise') { baseCostCents = data.basePrices.enterprise_monthly; baseSetupCents = data.basePrices.enterprise_setup; }
          // Data tier: one-time price only (no setup, no monthly)
          if (t.id === 'data') return t;
          
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

    // Handle route query params for generic login / configurator auth / auth errors
    this.route.queryParams.subscribe(params => {
      // Handle auth_error from OAuth callback failures
      if (params['auth_error']) {
        const errorMsg = decodeURIComponent(params['auth_error']);
        this.authError.set(errorMsg);
        // Open the auth modal so user can try again
        this.selectedTier.set(null);
        this.showContract.set(true);
        this.modalStep.set('auth');
        // Clean up the URL
        this.router.navigate([], { replaceUrl: true, queryParams: { auth_error: null }, queryParamsHandling: 'merge' });
        return;
      }
      
      if (params['login'] === 'true' && !this.api.currentUser()) {
        this.selectedTier.set(null);
        const intent = this.api.peekPendingIntent();
        if (intent && intent.type === 'configuration') {
          this.pendingConfigIntent = intent.configuration;
          this.acceptedTerms = true;
        }
        this.showContract.set(true);
        this.modalStep.set('auth');
        // Clean up the URL so it doesn't reopen on refresh
        this.router.navigate([], { replaceUrl: true, queryParams: { login: null }, queryParamsHandling: 'merge' });
      }
    });

    // Handle return from Google Login / Resume flow
    this.api.checkStatus().subscribe(user => {
      // Check for unified pending intent first
      const intent = this.api.getPendingIntent();
      
      if (intent) {
        if (intent.type === 'data') {
          // Data intents are handled by the data portal
          this.router.navigate(['/data-cleanup']);
          return;
        }

        if (intent.type === 'configuration' && intent.configuration) {
          if (user) {
            if (user.hasFinalizedProfile) {
              this.executeConfigurationCheckout(intent.configuration, intent.configuration.discountCode);
            } else {
              this.pendingConfigIntent = intent.configuration;
              this.selectedTier.set(null);
              this.showContract.set(true);
              this.modalStep.set('onboarding');
              this.firstName = user.firstName || '';
              this.lastName = user.lastName || '';
              this.businessName = user.businessName || '';
              this.acceptedTerms = true;
            }
          }
          return;
        }
        
        if (intent.type === 'service' && intent.action === 'add-to-cart' && intent.tierId) {
          // Service add-to-cart intent — add to cart and show confirmation
          if (user) {
            this.addServiceToCartApi(intent.tierId, intent.tierName || '', undefined, undefined, intent.projectType);
          }
          return;
        }

        if (intent.type === 'service' && intent.action === 'buy-now' && intent.tierId) {
          const tier = this.tiers().find(t => t.id === intent.tierId);
          if (tier && user) {
            if (intent.discountCode) {
              this.discountCode.set(intent.discountCode);
            }
            if (user.hasFinalizedProfile) {
              this.firstName = user.firstName;
              this.lastName = user.lastName;
              this.checkoutLoading.set(true);
              this.triggerStripe(tier);
            } else {
              this.selectedTier.set(tier);
              this.showContract.set(true);
              this.modalStep.set('onboarding');
              this.firstName = user.firstName || '';
              this.lastName = user.lastName || '';
              this.businessName = user.businessName || '';
            }
          }
          return;
        }
      }

      // Legacy fallback: check old sessionStorage keys
      const savedTierId = sessionStorage.getItem('checkout_tier');
      const isGenericLogin = sessionStorage.getItem('generic_login');
      
      if (savedTierId) {
        sessionStorage.removeItem('checkout_tier');
        if (savedTierId === 'data') {
          this.router.navigate(['/data-cleanup']);
          return;
        }
        const tier = this.tiers().find(t => t.id === savedTierId);
        if (tier) {
          if (user && user.hasFinalizedProfile) {
            this.firstName = user.firstName;
            this.lastName = user.lastName;
            this.checkoutLoading.set(true);
            this.triggerStripe(tier);
          } else {
            this.selectedTier.set(tier);
            this.showContract.set(true);
            this.modalStep.set(user ? 'onboarding' : 'auth');
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
      'Care Plans & Growth Packages | Phoenix',
      'Website design and care plans from Phoenix. Review setup fees, monthly costs, scope, and contract terms before purchase.'
    );
    
    this.injectJsonLd();
  }

  openContract(tier: ServiceTier) {
    // Data tier → redirect to the data portal (it handles its own login + cart flow)
    if (tier.id === 'data') {
      this.router.navigate(['/data-cleanup']);
      return;
    }

    const user = this.api.currentUser();
    
    this.acceptedTerms = false;
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

  openContractWithDiscount(tier: ServiceTier, code: string) {
    this.discountCode.set(code.trim().toUpperCase());
    this.openContract(tier);
    this.activeDropdownTier.set(null);
  }

  closeContract() {
    this.showContract.set(false);
    this.selectedTier.set(null);
    this.pendingConfigIntent = null;
    this.hasAccepted = false;
    this.acceptedTerms = false;
    this.discountCode.set('');
    this.discountError.set(null);
    this.isAnimatingDiscount.set(false);
    this.appliedDiscountPercentage.set(0);
    this.authSubView.set('login');
    this.authError.set(null);
    this.authSuccessMsg.set(null);
    this.resetCode = '';
    this.newResetPassword = '';
    this.confirmResetPassword = '';
    sessionStorage.removeItem('checkout_tier');
  }

  /** Add a service tier to cart (login-first pattern) */
  addTierToCart(tier: ServiceTier) {
    const intent: any = {
      action: 'add-to-cart',
      type: 'service',
      tierId: tier.id,
      tierName: tier.title,
    };

    if (!this.api.ensureLoggedIn(intent, '/services')) return;

    // Parse setup price from cost string (e.g. "1499" → 1499)
    const setupPrice = tier.setup ? Number(tier.setup.replace(/[^0-9.]/g, '')) : 0;
    // Format monthly with dollar sign — tier.cost is already the discounted price from env vars
    const monthlyStr = tier.cost ? `$${Number(tier.cost).toLocaleString()}/mo` : '';

    this.addServiceToCartApi(tier.id, tier.title, setupPrice, monthlyStr);
  }

  /** Internal: call the API to add a service tier to the user's cart */
  private addServiceToCartApi(tierId: string, tierName: string, price?: number, monthlyPrice?: string, projectType?: string) {
    this.api.post<any>('data-portal/cart/add-service', {
      tierId,
      tierName,
      tierDescription: '',
      projectType: projectType || '',
      price: price || 0,
      monthlyPrice: monthlyPrice || ''
    }).subscribe({
      next: (res) => {
        this.api.dataCart.set(res.cart || []);
        alert(`${tierName} added to cart!`);
      },
      error: (err) => {
        if (err.status === 409) {
          alert(err.error?.message || 'This service is already in your cart.');
        }
      }
    });
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
      signupRef: (() => { try { return localStorage.getItem('pw_signup_ref') || ''; } catch { return ''; } })(),
      email: this.userEmail,
      password: this.userPassword // Only used if isNewUser
    };

    const handlePostAuthCheckout = (user: any) => {
      this.api.currentUser.set(user);
      const configToExecute = this.pendingConfigIntent || (this.api.peekPendingIntent()?.type === 'configuration' ? this.api.getPendingIntent()?.configuration : null);
      if (configToExecute) {
        this.executeConfigurationCheckout(configToExecute, configToExecute.discountCode);
      } else if (tier) {
        this.triggerStripe(tier);
      } else {
        this.closeContract();
        this.router.navigate(['/home']);
      }
    };

    // If it's a completely new email user, we register them now
    if (this.isNewUser && !this.api.currentUser()) {
      this.api.post('auth/register', {
        ...payload,
        email: this.userEmail,
        password: this.userPassword
      }).subscribe({
        next: (user) => {
          handlePostAuthCheckout(user);
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
          handlePostAuthCheckout(user);
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          console.error('Onboarding error:', err);
          alert('Failed to save your profile. Please try again.');
        }
      });
    }
  }

  executeConfigurationCheckout(config: any, discountCode?: string) {
    this.checkoutLoading.set(true);
    const user = this.api.currentUser();
    const finalFirstName = user?.firstName || this.firstName;
    const finalLastName = user?.lastName || this.lastName;

    this.api.post<{ url: string }>('stripe/checkout', {
      checkoutMode: 'configuration',
      configuration: config,
      discountCode: discountCode || config?.discountCode,
      email: user?.email || this.userEmail,
      name: `${finalFirstName} ${finalLastName}`.trim(),
      businessName: user?.businessName || this.businessName,
      acceptedContract: true,
      contractTimestamp: new Date().toISOString()
    }).subscribe({
      next: (res) => {
        this.checkoutLoading.set(false);
        this.closeContract();
        if (res && res.url) {
          window.location.href = res.url;
        }
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        console.error('Configurator checkout error:', err);
        alert(err?.error?.error || 'Failed to initialize secure checkout session. Please try again.');
      }
    });
  }

  private triggerStripe(tier: ServiceTier) {
    if (!this.acceptedTerms) {
      this.checkoutLoading.set(false);
      this.openContract(tier);
      return;
    }
    const user = this.api.currentUser();
    const finalFirstName = user?.firstName || this.firstName;
    const finalLastName = user?.lastName || this.lastName;
    
    const payload = {
      tier: tier.id,
      email: user?.email || this.userEmail,
      name: `${finalFirstName} ${finalLastName}`.trim(),
      businessName: user?.businessName || this.businessName,
      acceptedContract: this.acceptedTerms,
      contractTimestamp: new Date().toISOString(),
      projectType: tier.id === 'enterprise' ? this.enterpriseProjectType : tier.title,
      discountCode: this.discountCode()
    };

    const doCheckout = () => {
      this.http.post<{url: string}>(`${environment.apiUrl}/stripe/checkout`, payload).subscribe({
        next: (res) => {
          this.checkoutLoading.set(false);
          this.closeContract();
          if (res && res.url) {
            window.location.href = res.url;
          }
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          console.error('Stripe error:', err);
          alert('Failed to initialize secure payment session.');
        }
      });
    };

    if (this.discountCode()) {
      this.discountError.set(null);
      this.api.post('stripe/validate-discount', { code: this.discountCode(), email: payload.email }).subscribe({
        next: (res: any) => {
          if (res.valid) {
            this.appliedDiscountPercentage.set(res.percentage);
            this.isAnimatingDiscount.set(true);
            setTimeout(() => {
              this.isAnimatingDiscount.set(false);
              doCheckout();
            }, 3000);
          }
        },
        error: (err) => {
          this.checkoutLoading.set(false);
          this.discountError.set(err.error?.error || 'Invalid discount code.');
        }
      });
    } else {
      doCheckout();
    }
  }

  loginWithGoogle() {
    if (this.selectedTier()) {
      // Save buy-now intent for this tier (legacy flow goes through openContract)
      this.api.savePendingIntent({
        action: 'buy-now',
        type: 'service',
        tierId: this.selectedTier()!.id,
        tierName: this.selectedTier()!.title,
        discountCode: this.discountCode() || undefined
      });
    } else if (this.pendingConfigIntent) {
      this.api.savePendingIntent({
        action: 'buy-now',
        type: 'configuration',
        configuration: this.pendingConfigIntent,
        acceptedContract: true
      });
    } else {
      const existing = this.api.peekPendingIntent();
      if (!existing) {
        sessionStorage.setItem('generic_login', 'true');
      }
    }
    this.api.loginWithGoogle('/services');
  }

  onEmailAuth() {
    if (!this.userEmail || !this.userPassword) {
      this.authError.set('Email and password required.');
      return;
    }
    this.authError.set(null);
    
    // Attempt Login (with the terms re-check once the form shows it)
    const payload: any = { email: this.userEmail, password: this.userPassword };
    if (this.loginNeedsTerms()) payload.acceptedTerms = this.loginTermsChecked();
    this.api.login(payload).subscribe({
      next: () => {
        this.isNewUser = false;
        const user = this.api.currentUser();
        const intent = this.api.getPendingIntent();
        
        if (user && user.hasFinalizedProfile) {
          // Returning user fully registered.
          if ((intent && intent.type === 'configuration' && intent.configuration) || this.pendingConfigIntent) {
            const config = intent?.configuration || this.pendingConfigIntent;
            this.executeConfigurationCheckout(config, config?.discountCode);
            return;
          }

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
          // Account exists but profile is not finalized
          if (intent && intent.type === 'configuration' && intent.configuration) {
            this.pendingConfigIntent = intent.configuration;
          }
          if (user) {
            this.firstName = user.firstName || '';
            this.lastName = user.lastName || '';
            this.businessName = user.businessName || '';
          }
          this.modalStep.set('onboarding');
        }
      },
      error: (err) => {
        // 403 TERMS_UPDATE_REQUIRED: terms changed since this account
        // accepted them; show the re-check box and let them retry.
        if (err.status === 403 && err.error?.code === 'TERMS_UPDATE_REQUIRED') {
          this.loginNeedsTerms.set(true);
          this.authError.set('Our terms were updated. Please re-accept them below to sign in.');
        }
        // 404 means the user doesn't exist -> Go to onboarding / registration
        else if (err.status === 404) {
          this.isNewUser = true;
          const intent = this.api.peekPendingIntent();
          if (intent && intent.type === 'configuration' && intent.configuration) {
            this.pendingConfigIntent = intent.configuration;
          }
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

  startForgotPassword() {
    this.authError.set(null);
    this.authSuccessMsg.set(null);
    this.forgotEmail = this.userEmail || '';
    this.authSubView.set('forgot');
  }

  backToLogin() {
    this.authSubView.set('login');
    this.authError.set(null);
    this.authSuccessMsg.set(null);
  }

  sendResetCode() {
    if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
      this.authError.set('Please provide a valid email address.');
      return;
    }
    this.authError.set(null);
    this.authSuccessMsg.set(null);
    this.resetLoading.set(true);

    this.api.post<any>('auth/forgot-password', { email: this.forgotEmail.trim() }).subscribe({
      next: (res) => {
        this.resetLoading.set(false);
        this.authSuccessMsg.set(res?.message || 'Verification code sent to your email.');
        this.authSubView.set('reset');
      },
      error: (err) => {
        this.resetLoading.set(false);
        this.authError.set(err.error?.error || 'Could not send verification code. Please check the email.');
      }
    });
  }

  submitPasswordReset() {
    if (!this.resetCode || !this.newResetPassword) {
      this.authError.set('Please enter both the 6-digit code and a new password.');
      return;
    }
    if (this.newResetPassword.length < 6) {
      this.authError.set('Password must be at least 6 characters.');
      return;
    }
    if (this.confirmResetPassword && this.newResetPassword !== this.confirmResetPassword) {
      this.authError.set('Passwords do not match.');
      return;
    }

    this.authError.set(null);
    this.authSuccessMsg.set(null);
    this.resetLoading.set(true);

    this.api.post<any>('auth/reset-password', {
      email: this.forgotEmail.trim(),
      code: this.resetCode.trim(),
      newPassword: this.newResetPassword
    }).subscribe({
      next: (res) => {
        this.resetLoading.set(false);
        this.authSuccessMsg.set('Password successfully reset! Signing in...');
        
        // Refresh authenticated user status
        this.api.checkStatus().subscribe(() => {
          this.authSubView.set('login');
          const user = this.api.currentUser();
          const intent = this.api.getPendingIntent();

          if (user && user.hasFinalizedProfile) {
            if ((intent && intent.type === 'configuration' && intent.configuration) || this.pendingConfigIntent) {
              const config = intent?.configuration || this.pendingConfigIntent;
              this.executeConfigurationCheckout(config, config?.discountCode);
              return;
            }
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
            // Need onboarding profile
            this.modalStep.set('onboarding');
          }
        });
      },
      error: (err) => {
        this.resetLoading.set(false);
        this.authError.set(err.error?.error || 'Failed to reset password. Please check your verification code.');
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
        itemListElement: [{ '@type': 'Service', name: 'Website design and maintenance' }]
      }
    });
    this.doc.head.appendChild(script);
    this.destroyRef.onDestroy(() => script.remove());
  }

  /** Navigate to the data portal page */
  navigateToData() {
    this.router.navigate(['/data-cleanup']);
  }
}
