import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private title = inject(Title);

  /**
   * Sets the canonical URL for the current page.
   * @param url The full canonical URL (e.g., 'https://carter-portfolio.fyi/home')
   */
  setCanonicalUrl(url: string) {
    let link: HTMLLinkElement | null = this.doc.querySelector('link[rel="canonical"]');
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  /**
   * Updates basic meta tags and page title.
   */
  updateMeta(title: string, description: string, image: string = 'https://www.carter-portfolio.fyi/images/og-image.jpg') {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    
    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    
    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }
}
