import { Component, HostListener, signal } from '@angular/core';

interface ConnectLink {
  label: string;
  url: string;
  icon: string;
}

@Component({
  selector: 'app-connect-panel',
  standalone: true,
  template: `
    <button type="button" (click)="toggle()" aria-haspopup="dialog" [attr.aria-expanded]="open()"
      class="inline-flex items-center gap-3 rounded-full border border-white/15 px-6 py-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/80 transition-colors hover:border-orange-500 hover:text-orange-400">
      <i class="fa-solid fa-share-nodes text-sm" aria-hidden="true"></i>
      Connect
    </button>

    <!-- Overlay -->
    <div class="connect-overlay" [class.open]="open()" (click)="close()"></div>

    <!-- Slide-out Panel -->
    <div class="connect-panel" [class.open]="open()" role="dialog" aria-label="Connect with Phoenix Websites AI">
      <div class="connect-header">
        <div>
          <h3>Connect</h3>
          <p>Find Phoenix Websites AI everywhere</p>
        </div>
        <button type="button" (click)="close()" class="connect-close" aria-label="Close connect panel">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>

      <nav class="connect-list" aria-label="Phoenix Websites AI platforms">
        @for (link of links; track link.url) {
          <a [href]="link.url" target="_blank" rel="noopener noreferrer" class="connect-row" (click)="close()">
            <span class="connect-icon"><i [class]="link.icon" aria-hidden="true"></i></span>
            <span class="connect-label">{{ link.label }}</span>
            <i class="fa-solid fa-arrow-up-right-from-square connect-arrow" aria-hidden="true"></i>
          </a>
        }
      </nav>
    </div>
  `,
  styles: [`
    .connect-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 240;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .connect-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .connect-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 380px;
      max-width: 90vw;
      height: 100dvh;
      background: #0a0a0a;
      border-left: 1px solid rgba(255, 255, 255, 0.1);
      z-index: 250;
      transform: translateX(100%);
      transition: transform var(--dur-med) var(--ease-spring-soft);
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .connect-panel.open {
      transform: translateX(0);
    }
    .connect-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .connect-header h3 {
      color: #fff;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      font-size: 0.8rem;
      margin: 0;
    }
    .connect-header p {
      color: rgba(255, 255, 255, 0.45);
      font-size: 0.8rem;
      margin: 0.4rem 0 0;
    }
    .connect-close {
      color: rgba(255, 255, 255, 0.6);
      background: none;
      border: none;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 0.25rem;
      transition: color 0.2s;
    }
    .connect-close:hover {
      color: #fb923c;
    }
    .connect-list {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      gap: 0.35rem;
      overflow-y: auto;
    }
    .connect-row {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.7rem 0.8rem;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: background 0.2s;
    }
    .connect-row:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .connect-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      flex: none;
      border-radius: 0.6rem;
      background: rgba(234, 88, 12, 0.12);
      color: #fb923c;
      font-size: 1.05rem;
    }
    .connect-label {
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.95rem;
      font-weight: 600;
      flex: 1;
    }
    .connect-row:hover .connect-label {
      color: #fff;
    }
    .connect-arrow {
      color: rgba(255, 255, 255, 0.25);
      font-size: 0.75rem;
    }
    .connect-row:hover .connect-arrow {
      color: #fb923c;
    }
  `]
})
export class ConnectPanelComponent {
  readonly open = signal(false);

  readonly links: ConnectLink[] = [
    { label: 'Free website audit', url: 'https://phoenixwebsites.ai', icon: 'fa-solid fa-globe' },
    { label: 'YouTube', url: 'https://www.youtube.com/@phoenixwebsites', icon: 'fa-brands fa-youtube' },
    { label: 'TikTok', url: 'https://www.tiktok.com/@phoenixwebsites.ai', icon: 'fa-brands fa-tiktok' },
    { label: 'Facebook', url: 'https://www.facebook.com/61595196375218', icon: 'fa-brands fa-facebook' },
    { label: 'X', url: 'https://x.com/CarterM75', icon: 'fa-brands fa-x-twitter' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/carter-moyer-66993b24a', icon: 'fa-brands fa-linkedin' },
    { label: 'Patreon', url: 'https://www.patreon.com/c/PhoenixWebsites', icon: 'fa-brands fa-patreon' },
    { label: 'Fiverr', url: 'https://www.fiverr.com/ph75nix', icon: 'fa-solid fa-briefcase' },
    { label: 'Gumroad', url: 'https://ph75nix.gumroad.com', icon: 'fa-solid fa-store' },
    { label: 'Product Hunt', url: 'https://www.producthunt.com/@ph75nix', icon: 'fa-brands fa-product-hunt' },
    { label: 'GitHub', url: 'https://github.com/Carter-75', icon: 'fa-brands fa-github' }
  ];

  toggle(): void {
    this.open.update(v => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }
}
