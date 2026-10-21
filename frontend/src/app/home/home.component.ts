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
  isOwner = computed(() => {
    const user = this.api.currentUser();
    if (!user) return false;
    if (user.isOwner) return true;
    const em = (user.email || '').toLowerCase().trim();
    return em === 'hello@phoenixwebsites.ai' || em === 'partnership@carter-portfolio.fyi';
  });
  activeAdminTab = signal<'visual' | 'promotions' | 'coupons' | 'orders' | 'groupbuy'>('visual');

  adminPromotions = signal<any>(null);
  adminCoupons = signal<any[]>([]);
  adminGroupBuys = signal<any[]>([]);
  gbEntries = signal<any[]>([]);
  gbEntriesFor = signal<string>('');
  gbForm = {
    name: '',
    percentOff: 90,
    joinPriceDollars: 100,
    slotsNeeded: 10,
    windowDays: 6,
    capSetupDollars: 1000,
    capMonthlyDollars: 10,
    capacityReason: '',
    redeemWindowDays: 90
  };
  adminOrders = signal<any[]>([]);
  adminLoading = signal(false);
  adminMessage = signal<string>('');

  newCoupon = {
    code: '',
    type: 'percentage' as 'percentage' | 'fixed',
    amount: 15,
    appliesTo: 'both' as 'setup' | 'monthly' | 'both',
    usageModel: 'repeatable' as 'repeatable' | 'single',
    usageLimit: 0,
    perCustomerLimit: 0,
    minimumSetupSubtotal: 0,
    minimumMonthlySubtotal: 0,
    startsAt: '',
    expiresAt: ''
  };

  editingCouponId = signal<string | null>(null);
  couponEditForm = {
    startsAt: '',
    expiresAt: '',
    usageLimit: 0,
    perCustomerLimit: 0
  };

  promoOverrideForm = {
    campaignId: 'evergreen',
    discountPercentage: 20,
    bannerText: ''
  };

  clients = [
    {
      name: 'Ice Cream Shop Concept', 
      type: 'Concept Build — E-Commerce', 
      url: 'https://example1-icecream.vercel.app/',
      desc: 'Design demonstration: a boutique e-commerce layout with smooth scroll animations and integrated cart flow. Built to showcase responsive product galleries and checkout UX patterns.'
    },
    {
      name: 'Bakery Storefront Concept', 
      type: 'Concept Build — Retail', 
      url: 'https://example2-cookies.vercel.app/',
      desc: 'Design demonstration: a rustic retail website concept with product browsing and visual storytelling. Built to showcase warm color palettes and artisan brand aesthetics.'
    },
    {
      name: 'Coffee Subscription Concept', 
      type: 'Concept Build — Subscription', 
      url: 'https://example3-coffee.vercel.app/',
      desc: 'Design demonstration: a subscription-model platform concept with recurring revenue flows and customer management. Built to showcase membership UX and delivery scheduling patterns.'
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
                  'text': 'During the subscription, you receive an exclusive commercial license to use your custom website. Full IP ownership is available via the Source Code Buyout option (50% of original setup fee), which transfers complete rights with zero ongoing obligations.'
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

  closeSecretMenu(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.showSecretMenu.set(false);
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

  gbRotation = signal<any>(null);

  loadGroupBuys() {
    if (!this.isOwner()) return;
    this.api.get<any>('group-buy/admin/events').subscribe({
      next: (res) => this.adminGroupBuys.set(res?.events || []),
      error: () => {}
    });
  }

  loadRotation() {
    if (!this.isOwner()) return;
    this.api.get<any>('group-buy/admin/rotation').subscribe({
      next: (res) => this.gbRotation.set(res),
      error: () => {}
    });
  }

  toggleRotation() {
    const next = !this.gbRotation()?.enabled;
    this.api.post<any>('group-buy/admin/rotation', { enabled: next }).subscribe({
      next: () => { this.adminMessage.set(`Rotation ${next ? 'resumed' : 'paused'}.`); this.loadRotation(); },
      error: (err) => this.adminMessage.set(err.error?.error || 'Could not change the rotation.')
    });
  }

  startNextEventNow() {
    this.api.post<any>('group-buy/admin/rotation/next-now', {}).subscribe({
      next: (res) => {
        this.adminMessage.set(`Started "${res.event?.name}" now. Announcement emails are going out to opted-in accounts.`);
        this.loadGroupBuys();
        this.loadRotation();
      },
      error: (err) => this.adminMessage.set(err.error?.error || 'Could not start the next event.')
    });
  }

  createGroupBuy() {
    if (!this.isOwner()) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');
    const f = this.gbForm;
    this.api.post<any>('group-buy/admin/events', {
      name: f.name,
      percentOff: f.percentOff,
      joinPriceCents: Math.round(f.joinPriceDollars * 100),
      slotsNeeded: f.slotsNeeded,
      windowDays: f.windowDays,
      capSetupCents: Math.round(f.capSetupDollars * 100),
      capMonthlyCents: Math.round(f.capMonthlyDollars * 100),
      capacityReason: f.capacityReason,
      redeemWindowDays: f.redeemWindowDays
    }).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set('Group buy draft created. Open it when you are ready to start the clock.');
        this.loadGroupBuys();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Could not create the group buy.');
      }
    });
  }

  openGroupBuy(id: string) {
    this.api.post<any>(`group-buy/admin/events/${id}/open`, {}).subscribe({
      next: () => { this.adminMessage.set('Group buy is open. The deadline clock is running.'); this.loadGroupBuys(); },
      error: (err) => this.adminMessage.set(err.error?.error || 'Could not open the event.')
    });
  }

  cancelGroupBuy(id: string) {
    this.api.post<any>(`group-buy/admin/events/${id}/cancel`, {}).subscribe({
      next: () => { this.adminMessage.set('Group buy cancelled. Joiners were emailed that they were not charged.'); this.loadGroupBuys(); },
      error: (err) => this.adminMessage.set(err.error?.error || 'Could not cancel the event.')
    });
  }

  viewGbEntries(id: string) {
    this.gbEntriesFor.set(id);
    this.api.get<any>(`group-buy/admin/events/${id}/entries`).subscribe({
      next: (res) => this.gbEntries.set(res?.entries || []),
      error: () => this.gbEntries.set([])
    });
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
    this.api.get<any>('admin/coupons').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.coupons || []);
        this.adminCoupons.set(list);
      },
      error: () => {}
    });
    this.api.get<any>('admin/orders').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.orders || []);
        this.adminOrders.set(list);
      },
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

    const cleanCode = this.newCoupon.code.trim().toUpperCase();
    const isSingle = this.newCoupon.usageModel === 'single';

    const payload: any = {
      code: cleanCode,
      type: this.newCoupon.type,
      amount: Number(this.newCoupon.amount) || 0,
      appliesTo: this.newCoupon.appliesTo,
      usageModel: this.newCoupon.usageModel,
      usageLimit: isSingle ? 1 : (Number(this.newCoupon.usageLimit) || 0),
      perCustomerLimit: isSingle ? 1 : 0,
      minimumSetupSubtotal: Number(this.newCoupon.minimumSetupSubtotal) || 0,
      minimumMonthlySubtotal: Number(this.newCoupon.minimumMonthlySubtotal) || 0,
      notes: isSingle ? '1-Time Single Use coupon' : 'Constant Repeatable coupon'
    };

    // Scheduled window: each date is sent only when the owner picked one.
    // No startsAt means the coupon starts immediately; no expiresAt means it never expires.
    if (this.newCoupon.startsAt) {
      payload.startsAt = new Date(this.newCoupon.startsAt).toISOString();
    }
    if (this.newCoupon.expiresAt) {
      payload.expiresAt = new Date(this.newCoupon.expiresAt).toISOString();
    }

    this.api.post<any>('admin/coupons', payload).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.adminMessage.set(`Coupon "${cleanCode}" created successfully as ${isSingle ? '1-Time Single Use' : 'Constant Repeatable'}!`);
        this.newCoupon.code = '';
        this.newCoupon.startsAt = '';
        this.newCoupon.expiresAt = '';
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

  startCouponEdit(coup: any) {
    if (!this.isOwner()) return;
    this.editingCouponId.set(coup._id);
    this.couponEditForm = {
      startsAt: this.toDateTimeLocal(coup.startsAt),
      expiresAt: this.toDateTimeLocal(coup.expiresAt),
      usageLimit: coup.usageLimit || 0,
      perCustomerLimit: coup.perCustomerLimit || 0
    };
  }

  cancelCouponEdit() {
    this.editingCouponId.set(null);
  }

  saveCouponEdit(id: string, code: string) {
    if (!this.isOwner()) return;
    this.adminLoading.set(true);
    this.adminMessage.set('');

    // Blank date fields clear the stored date: no startsAt means the
    // coupon is active immediately, no expiresAt means it never expires.
    const payload = {
      startsAt: this.couponEditForm.startsAt ? new Date(this.couponEditForm.startsAt).toISOString() : null,
      expiresAt: this.couponEditForm.expiresAt ? new Date(this.couponEditForm.expiresAt).toISOString() : null,
      usageLimit: Number(this.couponEditForm.usageLimit) || 0,
      perCustomerLimit: Number(this.couponEditForm.perCustomerLimit) || 0
    };

    this.api.patch<any>(`admin/coupons/${id}`, payload).subscribe({
      next: () => {
        this.adminLoading.set(false);
        this.editingCouponId.set(null);
        this.adminMessage.set(`Coupon "${code}" schedule and limits updated.`);
        this.loadAdminData();
      },
      error: (err) => {
        this.adminLoading.set(false);
        this.adminMessage.set(err.error?.error || 'Failed to update coupon.');
      }
    });
  }

  private toDateTimeLocal(value: any): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
