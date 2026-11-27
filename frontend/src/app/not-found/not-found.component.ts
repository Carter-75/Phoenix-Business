import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="min-h-screen flex flex-col items-center justify-center px-6 py-24 bg-slate-950 text-white">
      <div class="text-center max-w-xl">
        <p class="text-9xl font-black text-orange-600 mb-4">404</p>
        <h1 class="text-4xl font-black uppercase tracking-tighter mb-4">Page Not Found</h1>
        <p class="text-slate-400 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <a routerLink="/" class="btn-fire press-spring">
            Go to Homepage
          </a>
          <a routerLink="/services" class="btn-ghost press-spring">
            View Services
          </a>
        </div>
        <p class="mt-12 text-slate-500 text-sm">
          Looking for something specific? <a href="mailto:hello@phoenixwebsites.ai" class="text-orange-500 hover:underline">Contact us</a>
        </p>
      </div>
    </main>
  `
})
export class NotFoundComponent implements OnInit {
  private meta = inject(Meta);

  ngOnInit() {
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
