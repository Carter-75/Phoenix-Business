import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen pt-48 pb-24 px-6 bg-slate-950 relative overflow-hidden">
      <!-- Background Glows -->
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/5 top-[-10%] right-[-10%]"></div>

      <div class="max-w-7xl mx-auto relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
          <div>
            <h1 class="text-5xl font-black text-white tracking-tighter uppercase mb-2">
              Client <span class="text-orange-500">Dashboard</span>
            </h1>
            <p class="text-slate-500 font-medium uppercase tracking-[0.2em] text-[10px]">Managing Infrastructure for {{ user()?.email }}</p>
          </div>
          <button (click)="logout()" class="px-6 py-3 rounded-xl border border-white/10 text-slate-500 hover:text-red-500 hover:border-red-500/30 transition-all text-xs font-black uppercase tracking-widest">
            Logout
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Subscription Status -->
          <div class="premium-card !p-8">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Service Tier</h3>
            <div class="flex items-center gap-4 mb-8">
              <div class="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <span class="text-2xl">🔥</span>
              </div>
              <div>
                <p class="text-white font-black text-xl tracking-tight uppercase">{{ user()?.subscriptionStatus || 'None' }}</p>
                <p class="text-slate-500 text-xs font-bold uppercase tracking-widest">Active Commitment</p>
              </div>
            </div>
            <button (click)="openPortal()" class="w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-black uppercase tracking-widest text-[10px] hover:bg-orange-600 transition-all">
              Manage Billing
            </button>
          </div>

          <!-- Contract Status -->
          <div class="premium-card !p-8 md:col-span-2">
            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">Legal Agreement</h3>
            <div class="space-y-6">
              <div class="flex items-start justify-between p-6 bg-slate-950 rounded-2xl border border-white/5">
                <div>
                  <p class="text-white font-black uppercase tracking-tight mb-1">12-Month Service Contract</p>
                  <p class="text-slate-500 text-xs font-medium">Status: {{ user()?.hasAcceptedContract ? 'Binding Engagement' : 'Pending Acceptance' }}</p>
                </div>
                <div *ngIf="user()?.hasAcceptedContract" class="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">
                  Secured
                </div>
              </div>
              <p class="text-slate-400 text-sm font-medium leading-relaxed italic">
                * Your contract includes a 50% liquidated damages clause for early termination and a strictly non-refundable payment policy as per the Terms of Service.
              </p>
            </div>
          </div>
        </div>

        <!-- Infrastructure Status -->
        <div class="mt-8 premium-card !p-8 bg-orange-600/5 border-orange-500/10">
          <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-6">System Health</h3>
          <div class="flex flex-wrap gap-8">
             <div class="flex items-center gap-3">
               <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span class="text-white text-xs font-black uppercase tracking-widest">Network Edge: Online</span>
             </div>
             <div class="flex items-center gap-3">
               <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span class="text-white text-xs font-black uppercase tracking-widest">AI Pipelines: Stable</span>
             </div>
             <div class="flex items-center gap-3">
               <div class="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
               <span class="text-white text-xs font-black uppercase tracking-widest">DB Cluster: Syncing</span>
             </div>
          </div>
        </div>
      </div>
    </section>
  `
})
export class DashboardComponent implements OnInit {
  public api = inject(ApiService);
  private router = inject(Router);
  user = signal<any>(null);

  ngOnInit() {
    this.api.get('auth/user').subscribe({
      next: (user) => this.user.set(user),
      error: () => this.router.navigate(['/login'])
    });
  }

  logout() {
    this.api.get('auth/logout').subscribe(() => {
      window.location.reload();
    });
  }

  openPortal() {
    this.api.post('stripe/create-portal-session', { email: this.user().email }).subscribe({
      next: (res: any) => {
        if (res.url) window.location.href = res.url;
      }
    });
  }
}
