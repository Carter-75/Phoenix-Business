import { Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-complete-profile',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <section class="min-h-screen relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
      <!-- Background Glows -->
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/10 top-[-10%] left-[-10%]"></div>
      
      <div class="relative z-10 w-full max-w-md">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-2">Finalize <span class="text-orange-500">Identity</span></h1>
          <p class="text-slate-400 font-medium">Please confirm your legal name for the partnership contract</p>
        </div>

        <div class="premium-card !p-10 space-y-8">
          <div class="space-y-6">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">First Name</label>
              <input [(ngModel)]="firstName" type="text" 
                     class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Last Name</label>
              <input [(ngModel)]="lastName" type="text" 
                     class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
            </div>
            
            <button (click)="saveProfile()" [disabled]="loading() || !firstName || !lastName"
                    class="primary-btn w-full !py-5 flex items-center justify-center disabled:opacity-50">
              {{ loading() ? 'Saving Profile...' : 'Complete Registration' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class CompleteProfileComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  
  firstName = '';
  lastName = '';
  loading = signal(false);

  ngOnInit() {
    // Pre-populate if possible
    this.api.get('auth/user').subscribe((user: any) => {
      if (user.hasFinalizedProfile) {
        // If already complete, skip to dashboard
        this.router.navigate(['/dashboard']);
      }
      this.firstName = user.firstName || '';
      this.lastName = user.lastName || '';
    });
  }

  saveProfile() {
    this.loading.set(true);
    this.api.post('auth/update-profile', { 
      firstName: this.firstName, 
      lastName: this.lastName 
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        alert('Failed to update profile');
      }
    });
  }
}
