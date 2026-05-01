import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  template: `
    <section class="min-h-screen relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden">
      <!-- Background Glows -->
      <div class="blur-glow w-[500px] h-[500px] bg-orange-600/10 top-[-10%] left-[-10%]"></div>
      <div class="blur-glow w-[500px] h-[500px] bg-purple-600/5 bottom-[-10%] right-[-10%]"></div>

      <div class="relative z-10 w-full max-w-md">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-black text-white tracking-tighter uppercase mb-2">Phoenix <span class="text-orange-500">Portal</span></h1>
          <p class="text-slate-400 font-medium">Access your enterprise infrastructure</p>
        </div>

        <div class="premium-card !p-10 space-y-8">
          <div class="space-y-4">
            <button (click)="loginWithGoogle()" 
                    class="w-full h-[60px] flex items-center justify-center gap-3 rounded-xl border border-white/10 hover:bg-white/5 text-white font-bold tracking-widest text-[10px] uppercase transition-all">
              <img src="https://www.google.com/favicon.ico" class="w-4 h-4" alt="Google">
              Continue with Google
            </button>
            
            <div class="relative flex items-center justify-center py-4">
              <div class="border-t border-white/5 w-full"></div>
              <span class="bg-slate-950 px-4 text-slate-500 text-[10px] font-black uppercase tracking-widest absolute">or secure email</span>
            </div>

            <div class="space-y-4">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Email Address</label>
                <input [(ngModel)]="email" type="email" 
                       class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
              </div>
              
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Password</label>
                <input [(ngModel)]="password" type="password" 
                       class="w-full h-[60px] bg-slate-950 border border-white/10 rounded-xl px-6 text-white focus:border-orange-500/50 outline-none transition-all">
              </div>
            </div>
            
            <button (click)="login()" [disabled]="loading()"
                    class="primary-btn w-full !py-5 flex items-center justify-center">
              {{ loading() ? 'Authenticating...' : 'Sign In' }}
            </button>

            <div *ngIf="errorMessage()" class="text-red-500 text-[10px] font-black uppercase tracking-widest text-center mt-4 bg-red-500/10 py-3 rounded-lg border border-red-500/20">
              {{ errorMessage() }}
            </div>
          </div>

          <div class="text-center pt-4">
            <p class="text-slate-500 text-xs font-medium">
              Don't have a deployment? 
              <a routerLink="/register" class="text-orange-500 hover:text-orange-400 transition-colors font-bold ml-1">Register Now</a>
            </p>
          </div>
        </div>

        <div class="mt-12 flex justify-center gap-8">
          <a routerLink="/privacy" class="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Privacy</a>
          <a routerLink="/terms" class="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Terms</a>
          <a routerLink="/refunds" class="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Refunds</a>
        </div>
      </div>
    </section>
  `
})
export class LoginComponent {
  private api = inject(ApiService);
  private router = inject(Router);
  
  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  login() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.errorMessage.set(null);
    this.api.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set('Security verification failed. Please check credentials.');
        console.error('[AUTH ERROR] Details hidden from UI:', err);
      }
    });
  }

  loginWithGoogle() {
    this.api.loginWithGoogle();
  }
}
