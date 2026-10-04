import { ConversionService } from '../services/conversion.service';
import { Component, signal, computed, inject, OnInit, afterNextRender, OnDestroy } from '@angular/core';
import { ApiService } from '../services/api.service';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../shared/pipes/safe.pipe';
import { ScrollRevealDirective } from '../shared/directives/scroll-reveal.directive';
import { PhoenixSettingsService } from '../services/phoenix-settings.service';
import { ThemePromotionService } from '../services/theme-promotion.service';
import { VoiceCallService } from '../services/voice-call.service';
import { SeoService } from '../services/seo.service';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule, ScrollRevealDirective, SafePipe],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit, OnDestroy {
  private seo = inject(SeoService);
  private conversions = inject(ConversionService);
  public api = inject(ApiService);
  public settings = inject(PhoenixSettingsService);
  public themePromo = inject(ThemePromotionService);
  public voiceCall = inject(VoiceCallService);
  
  submitting = signal(false);
  success = signal(false);
  errorMessage = signal('');
  
  // Secret Menu & Owner Admin State
  secretClickCount = signal(0);
  showSecretMenu = signal(false);
  isOwner = computed(() => this.api.currentUser()?.email === 'hello@phoenixwebsites.ai');
  activeAdminTab = signal<'visual' | 'promotions' | 'coupons' | 'orders'>('visual');

  adminPromotions = signal<any>(null);
  adminCoupons = signal<any[]>([]);
  adminOrders = signal<any[]>([]);
  adminLoading = signal(false);
  adminMessage = signal<string>('');

  newCoupon = {
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    amount: 15,
    appliesTo: 'both' as 'setup' | 'monthly' | 'both',
    usageLimit: 50,
    minimumSetupSubtotal: 0,
    minimumMonthlySubtotal: 0
  };

  promoOverrideForm = {
    campaignId: 'evergreen',
    discountPercentage: 20,
    bannerText: ''
  };

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
      desc: 'Retail design demo with product browsing.'
    },
    {
      name: 'Craft Coffee', 
      type: 'Subscription Model', 
      url: 'https://example3-coffee.vercel.app/',
      desc: 'Recurring revenue platform with customer management portal.'
    }
  ];

  constructor() {
    afterNextRender(() => {
      this.initAnimations();
    });
  }

  ngOnInit() {
    this.seo.updateMeta({
      title: 'Phoenix Websites AI | AI-Powered Full-Stack Web Development',
      description: 'Phoenix Websites AI builds custom websites and full-stack web applications for clients. AI accelerates development while expert human engineers provide architecture, quality assurance, and ongoing care.',
      canonicalUrl: 'https://phoenixwebsites.ai/',
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': 'https://phoenixwebsites.ai/#organization',
            'name': 'Phoenix Websites AI',
            'url': 'https://phoenixwebsites.ai',
            'logo': 'https://phoenixwebsites.ai/logo.png',
            'email': 'hello@phoenixwebsites.ai',
            'telephone': '+1-760-334-7874',
            'founder': {
              '@type': 'Person',
              'name': 'Carter Moyer',
              'url': 'https://carter-portfolio.fyi'
            },
            'sameAs': [
              'https://www.youtube.com/channel/UCfawV121RAj1CYU69Nk69Rg',
              'https://www.patreon.com/PhoenixWebsites'
            ]
          },
          {
            '@type': 'WebSite',
            '@id': 'https://phoenixwebsites.ai/#website',
            'url': 'https://phoenixwebsites.ai',
            'name': 'Phoenix Websites AI',
            'publisher': {
              '@id': 'https://phoenixwebsites.ai/#organization'
            }
          },
          {
            '@type': 'FAQPage',
            '@id': 'https://phoenixwebsites.ai/#faq',
            'mainEntity': [
              {
                '@type': 'Question',
                'name': 'What is Phoenix Websites AI?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Phoenix Websites AI is an AI-native web development company that builds custom websites and full-stack web applications for clients. AI accelerates development while human oversight is used for architecture, review, quality assurance, and delivery.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Is Phoenix Websites AI a DIY website builder?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'No. Phoenix Websites AI is not a DIY website builder or template marketplace. Clients hire us to handle every phase of design, custom engineering, testing, and managed hosting.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Do customers have to write prompts or build the website themselves?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'No. Customers never write prompts or touch complex code. You provide your business requirements and goals; our engineering team handles the AI workflows and human review.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Who owns the finished website and code?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'The customer owns 100% of the finished website code, assets, and design. There is zero proprietary platform lock-in.'
                }
              },
              {
                '@type': 'Question',
                'name': 'Can Phoenix Websites AI build full-stack web applications?',
                'acceptedAnswer': {
                  '@type': 'Answer',
                  'text': 'Yes. We engineer complete full-stack web applications, including custom user authentication, database models, client portals, admin dashboards, and third-party API integrations.'
                }
              }
            ]
          }
        ]
      }
    });

    // Health check
    this.api.get('health').subscribe({
      error: () => {}
    });
  }

  onSubmitLead(event: Event) {
    event.preventDefault();
    if (this.submitting()) return;
    this.success.set(false);
    this.errorMessage.set('');
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      businessName: formData.get('businessName'),
      message: formData.get('requirements'),
      website: formData.get('website'),
      attribution: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].map(key => [key, new URLSearchParams(location.search).get(key)]))
    };

    this.submitting.set(true);
    this.api.post<{requestId: string}>('leads/capture', payload).subscribe({
      next: (result) => {
        this.submitting.set(false);
        this.success.set(true);
        form.reset();
        // Fire only after the server confirms durable capture. No contact data enters analytics.
        this.conversions.lead(result.requestId);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.error?.error || 'Your request could not be saved. Please try again.');
      }
    });
  }

  scrollToAudit() {
    document.getElementById('audit')?.scrollIntoView({ behavior: 'smooth' });
  }

  onTitleClick() {
    this.secretClickCount.update(c => c + 1);
    if (this.secretClickCount() >= 5) {
      this.showSecretMenu.set(true);
      this.secretClickCount.set(0); // Reset after opening
      // If user is logged in, check owner status and load admin data
      this.api.checkStatus().subscribe(() => {
        if (this.isOwner()) {
          this.loadAdminData();
        }
      });
    }
  }

  loadAdminData() {
    if (!this.isOwner()) return;
    this.adminLoading.set(true);
    this.api.get<any>('admin/promotions').subscribe({
      next: (res) => {
        this.adminPromotions.set(res);
        this.adminLoading.set(false);
      },
      error: () => this.adminLoading.set(false)
    });
    this.api.get<any[]>('admin/coupons').subscribe({
      next: (res) => this.adminCoupons.set(res || []),
      error: () => {}
    });
    this.api.get<any[]>('admin/orders').subscribe({
      next: (res) => this.adminOrders.set(res || []),
      error: () => {}
    });
  }

  submitPromoOverride() {
    if (!this.isOwner()) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');
    this.api.post<any>('admin/promotions/override', this.promoOverrideForm).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set(`Override applied for ${this.promoOverrideForm.campaignId}!`);
        this.loadAdminData();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Failed to apply promotion override.');
      }
    });
  }

  resetPromoOverrides(campaignId?: string) {
    if (!this.isOwner()) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');
    this.api.post<any>('admin/promotions/reset', { campaignId }).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set('Promotion overrides reset to calendar defaults.');
        this.loadAdminData();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Failed to reset promotions.');
      }
    });
  }

  submitNewCoupon() {
    if (!this.isOwner() || !this.newCoupon.code) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');
    this.api.post<any>('admin/coupons', this.newCoupon).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set(`Coupon "${this.newCoupon.code.toUpperCase()}" created successfully!`);
        this.newCoupon.code = '';
        this.loadAdminData();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Failed to create coupon.');
      }
    });
  }

  toggleCoupon(id: string, currentEnabled: boolean) {
    if (!this.isOwner()) return;
    this.api.patch<any>(`admin/coupons/${id}/toggle`, { enabled: !currentEnabled }).subscribe({
      next: () => this.loadAdminData(),
      error: (err) => this.adminMessage.set(err.error?.error || 'Failed to toggle coupon.')
    });
  }

  deleteCoupon(id: string, code: string) {
    if (!this.isOwner()) return;
    if (!confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');
    this.api.delete<any>(`admin/coupons/${id}`).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set(`Coupon "${code}" deleted successfully.`);
        this.loadAdminData();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Failed to delete coupon.');
      }
    });
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
  }
}
