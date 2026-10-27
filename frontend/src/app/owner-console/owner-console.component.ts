import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { PhoenixSettingsService } from '../services/phoenix-settings.service';
import { ThemePromotionService } from '../services/theme-promotion.service';

@Component({
  selector: 'app-owner-console',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './owner-console.component.html'
})
export class OwnerConsoleComponent implements OnInit {
  public api = inject(ApiService);
  public settings = inject(PhoenixSettingsService);
  public themePromo = inject(ThemePromotionService);

  // Secret Menu & Owner Admin State
  isOwner = computed(() => {
    const user = this.api.currentUser();
    if (!user) return false;
    if (user.isOwner) return true;
    const em = (user.email || '').toLowerCase().trim();
    return em === 'hello@phoenixwebsites.ai' || em === 'partnerships@carter-portfolio.fyi';
  });
  activeAdminTab = signal<'visual' | 'promotions' | 'coupons' | 'orders' | 'groupbuy' | 'users'>('visual');

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
  adminUsers = signal<any[]>([]);
  welcomeResendMsg = signal('');
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

  ngOnInit() {
    this.api.checkStatus().subscribe(() => {
      if (this.isOwner()) {
        this.loadAdminData();
        this.loadGroupBuys();
        this.loadRotation();
      }
    });
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

  gbDeadlineById: Record<string, string> = {};

  extendGroupBuyDeadline(ev: any) {
    const value = this.gbDeadlineById[ev._id];
    if (!value) { this.adminMessage.set('Pick a new deadline date and time first.'); return; }
    this.api.post<any>(`group-buy/admin/events/${ev._id}/deadline`, { deadline: new Date(value).toISOString() }).subscribe({
      next: () => { this.adminMessage.set('Deadline updated. Check the event row shows the new closing time.'); this.loadGroupBuys(); },
      error: (err) => this.adminMessage.set(err.error?.error || 'Could not update the deadline.')
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
    this.api.get<any>('admin/users').subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : (res?.users || []);
        this.adminUsers.set(list);
      },
      error: () => {}
    });
  }

  resendWelcome(u: any) {
    this.welcomeResendMsg.set('');
    this.api.post<any>(`admin/users/${u.id}/resend-welcome`, {}).subscribe({
      next: (res) => this.welcomeResendMsg.set(`Welcome email re-sent to ${u.email} (code ${res?.code || u.welcomeCouponCode || 'n/a'})`),
      error: (err) => this.welcomeResendMsg.set(`Resend failed for ${u.email}: ${err?.error?.error || 'unknown error'}`)
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
}
