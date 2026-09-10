import { ConversionService } from '../services/conversion.service';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-data-cleanup',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main class="min-h-screen bg-[#020205] text-white px-6 pt-40 pb-24">
      <div class="max-w-4xl mx-auto">
        <p class="text-orange-500 uppercase tracking-widest text-sm mb-5">Data cleanup & organization</p>
        <h1 class="text-4xl sm:text-6xl font-bold leading-tight mb-6">Put your files to work.</h1>
        <p class="text-xl text-white/70 max-w-2xl mb-6">Get help cleaning and organizing the data you already have. Work directly with Carter to turn messy spreadsheets into clear, useful files and reports.</p>
        <p class="text-white/60 mb-12">Microsoft tools and AI can assist the work. We agree on the scope, price, and handling of your files before the project starts.</p>
        <div class="grid sm:grid-cols-3 gap-6 mb-14">
          <section class="border border-white/20 rounded-2xl p-6"><h2 class="text-xl font-bold mb-3">Clean up</h2><p class="text-white/70">Review duplicate rows, inconsistent names, missing values, and formatting problems.</p></section>
          <section class="border border-white/20 rounded-2xl p-6"><h2 class="text-xl font-bold mb-3">Organize</h2><p class="text-white/70">Arrange client-provided spreadsheets and CSV files into a consistent structure.</p></section>
          <section class="border border-white/20 rounded-2xl p-6"><h2 class="text-xl font-bold mb-3">Make it useful</h2><p class="text-white/70">Prepare tables, summaries, or reports that fit the work you need to do.</p></section>
        </div>
        <section class="border border-orange-500/40 rounded-2xl p-6 sm:p-10">
          <h2 class="text-3xl font-bold mb-3">Request a project review</h2>
          <p class="text-white/70 mb-6">Describe the files and the result you need. Do not paste passwords, personal records, or confidential data here. We will arrange file sharing after reviewing your request.</p>
          <form (submit)="submit($event)" class="grid gap-5">
            <div><label for="cleanup-name" class="block mb-2">Your name</label><input id="cleanup-name" name="name" required maxlength="120" autocomplete="name" class="w-full bg-black border border-white/30 rounded-lg p-3"></div>
            <div><label for="cleanup-email" class="block mb-2">Email address</label><input id="cleanup-email" name="email" type="email" required maxlength="254" autocomplete="email" class="w-full bg-black border border-white/30 rounded-lg p-3"></div>
            <div><label for="cleanup-business" class="block mb-2">Business name (optional)</label><input id="cleanup-business" name="businessName" maxlength="200" autocomplete="organization" class="w-full bg-black border border-white/30 rounded-lg p-3"></div>
            <div><label for="cleanup-message" class="block mb-2">What do you need help with?</label><textarea id="cleanup-message" name="message" required maxlength="1800" rows="5" placeholder="File type, approximate size, current problem, and the result you need." class="w-full bg-black border border-white/30 rounded-lg p-3"></textarea></div>
            <p class="text-sm text-white/60">Your contact details are used to respond to this request. <a routerLink="/privacy" class="underline">Privacy policy</a></p>
            <button type="submit" [disabled]="busy()" class="bg-orange-600 rounded-lg px-6 py-4 font-bold disabled:opacity-50">{{busy() ? 'Saving…' : 'Request a Quote'}}</button>
            <p *ngIf="saved()" role="status" class="text-green-400">Your request is saved. We will follow up by email.</p>
            <p *ngIf="error()" role="alert" class="text-red-400">{{error()}}</p>
          </form>
        </section>
      </div>
    </main>
  `
})
export class DataCleanupComponent {
  private conversions = inject(ConversionService);
  private api = inject(ApiService);
  busy = signal(false);
  saved = signal(false);
  error = signal('');
  constructor() {
    inject(SeoService).updateMeta('Data Cleanup & Organization | Phoenix', 'Clean and organize your own spreadsheets and files with Phoenix. Request a quote for Microsoft-tool and AI-assisted data work.');
  }
  submit(event: Event) {
    event.preventDefault();
    if (this.busy()) return;
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    if (!form.reportValidity()) return;
    this.busy.set(true); this.saved.set(false); this.error.set('');
    const params = new URLSearchParams(location.search);
    this.api.post<{requestId: string}>('leads/capture', {
      name: data.get('name'), email: data.get('email'), businessName: data.get('businessName'),
      message: '[Data cleanup request] ' + String(data.get('message') || ''),
      attribution: Object.fromEntries(['utm_source','utm_medium','utm_campaign','utm_content'].map(key => [key, params.get(key)]))
    }).subscribe({
      next: (result) => { this.busy.set(false); this.saved.set(true); form.reset();
        this.conversions.lead(result.requestId);
      },
      error: err => { this.busy.set(false); this.error.set(err.error?.error || 'We could not save your request. Please try again.'); }
    });
  }
}
