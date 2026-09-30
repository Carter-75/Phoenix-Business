import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  canonicalUrl?: string;
  image?: string;
  type?: string;
  robots?: string;
  jsonLd?: object;
}

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private doc = inject(DOCUMENT);
  private meta = inject(Meta);
  private title = inject(Title);

  /**
   * Sets the canonical URL for the current page.
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
   * Sets or updates robots indexing directive.
   */
  setRobots(content: string = 'index, follow') {
    this.meta.updateTag({ name: 'robots', content });
  }

  /**
   * Injects or updates JSON-LD structured data.
   */
  setJsonLd(schema: object, scriptId: string = 'page-structured-data') {
    let script: HTMLScriptElement | null = this.doc.getElementById(scriptId) as HTMLScriptElement;
    if (!script) {
      script = this.doc.createElement('script');
      script.id = scriptId;
      script.type = 'application/ld+json';
      this.doc.head.appendChild(script);
    }
    script.text = JSON.stringify(schema);
  }

  /**
   * Updates page title, meta description, canonical URL, OG tags, Twitter cards, and optional JSON-LD.
   */
  updateMeta(
    titleOrConfig: string | SeoConfig,
    description?: string,
    image: string = 'https://phoenixwebsites.ai/logo.png'
  ) {
    let config: SeoConfig;
    if (typeof titleOrConfig === 'string') {
      config = {
        title: titleOrConfig,
        description: description || '',
        image,
        type: 'website'
      };
    } else {
      config = {
        image: 'https://phoenixwebsites.ai/logo.png',
        type: 'website',
        robots: 'index, follow',
        ...titleOrConfig
      };
    }

    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });

    if (config.canonicalUrl) {
      this.setCanonicalUrl(config.canonicalUrl);
      this.meta.updateTag({ property: 'og:url', content: config.canonicalUrl });
    }

    if (config.robots) {
      this.setRobots(config.robots);
    }

    const ogImage = config.image || 'https://phoenixwebsites.ai/logo.png';
    const ogType = config.type || 'website';

    // Open Graph
    this.meta.updateTag({ property: 'og:site_name', content: 'Phoenix Websites AI' });
    this.meta.updateTag({ property: 'og:title', content: config.title });
    this.meta.updateTag({ property: 'og:description', content: config.description });
    this.meta.updateTag({ property: 'og:image', content: ogImage });
    this.meta.updateTag({ property: 'og:type', content: ogType });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: config.title });
    this.meta.updateTag({ name: 'twitter:description', content: config.description });
    this.meta.updateTag({ name: 'twitter:image', content: ogImage });

    // JSON-LD
    if (config.jsonLd) {
      this.setJsonLd(config.jsonLd);
    }
  }
}
