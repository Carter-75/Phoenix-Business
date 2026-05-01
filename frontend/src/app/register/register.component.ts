import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <section class="min-h-screen relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
      <!-- Background Glows -->
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/10 top-[-10%] left-[-10%]"></div>
      <div class="blur-glow w-[500px] h-[500px] bg-purple-600/5 bottom-[-10%] right-[-10%]"></div>

      <div class="relative z-10 w-full max-w-md">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-2">Phoenix <span class="text-orange-500">Genesis</span></h1>
          <p class="text-slate-400 font-medium">Initialize your partnership agreement</p>
        </div>

        <div class="premium-card !p-10 space-y-8">
          <div class="space-y-6">
            <div class="grid grid-cols-2 gap-4">
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
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Business Email</label>
              <input [(ngModel)]="email" type="email" 
                     class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
            </div>
            
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Secure Password</label>
              <input [(ngModel)]="password" type="password" 
                     class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
            </div>
            
            <button (click)="register()" [disabled]="loading()"
                    class="primary-btn w-full !py-5 flex items-center justify-center">
              {{ loading() ? 'Creating Profile...' : 'Begin Partnership' }}
            </button>
          </div>

          <div class="text-center pt-4">
            <p class="text-slate-500 text-xs font-medium">
              Already have an agreement? 
              <a routerLink="/login" class="text-orange-500 hover:text-orange-400 transition-colors font-bold ml-1">Sign In</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  `
})
export class RegisterComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  loading = signal(false);

  register() {
    if (!this.email || !this.password || !this.firstName || !this.lastName) return;
    this.loading.set(true);
    this.api.post('auth/register', { 
      email: this.email, 
      password: this.password,
      firstName: this.firstName,
      lastName: this.lastName
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        alert(err.error?.message || 'Registration failed');
      }
    });
  }
}
