import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { environment } from '../../environments/environment';

interface ServiceTier {
  id: string;
  title: string;
  description: string;
  cost: number;
  features: string[];
  featured?: boolean;
  isSubscription?: boolean;
  checkoutUrl?: string;
}

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrl: './services.component.css'
})
export class ServicesComponent {
  private api = inject(ApiService);

  readonly tiers: ServiceTier[] = [
    {
      id: 'essential',
      title: 'Phoenix Core',
      description: 'The foundation for startups needing elite speed and basic AI integration.',
      cost: 499,
      isSubscription: true,
      features: [
        'High-Performance Landing Page',
        'Edge Network Deployment',
        'Basic AI Assistant Integration',
        'Monthly Health Audits',
        'SSL & Security Hardening'
      ]
    },
    {
      id: 'advanced',
      title: 'Phoenix Pro',
      description: 'For growing businesses requiring complex systems and full automation.',
      cost: 999,
      featured: true,
      isSubscription: true,
      features: [
        'Everything in Core',
        'Custom Workflow Automation',
        'Advanced LLM Data Pipelines',
        'Priority Technical Support',
        'SEO & Conversion Optimization',
        'User Auth & Dashboard Systems'
      ]
    },
    {
      id: 'enterprise',
      title: 'Phoenix Elite',
      description: 'Uncompromising infrastructure for high-scale enterprise operations.',
      cost: 2499,
      isSubscription: true,
      features: [
        'Everything in Pro',
        'Bespoke AI Persona Engineering',
        'Zero-Latency Global Infrastructure',
        '24/7 Direct Engineer Access',
        'Custom Legal & Security Compliance',
        'Multi-System Microservices'
      ]
    }
  ];

  showContract = signal(false);
  selectedTier = signal<ServiceTier | null>(null);
  hasAccepted = false;

  openContract(tier: ServiceTier) {
    if (!tier.isSubscription) {
      // For one-time payments, skip the yearly contract modal
      this.selectedTier.set(tier);
      this.hasAccepted = true; // Mark as "accepted" implicitly for one-time
      this.proceedToCheckout();
      return;
    }
    this.selectedTier.set(tier);
    this.showContract.set(true);
  }

  closeContract() {
    this.showContract.set(false);
    this.selectedTier.set(null);
    this.hasAccepted = false;
  }

  proceedToCheckout() {
    if (!this.hasAccepted || !this.selectedTier()) return;

    const tier = this.selectedTier()!;
    
    // Redirect to Stripe or handle backend checkout creation
    // For now, we'll call a backend endpoint to create a checkout session
    this.api.post('stripe/create-checkout-session', {
      tierId: tier.id,
      acceptedContract: true,
      contractTimestamp: new Date().toISOString()
    }).subscribe({
      next: (res: any) => {
        if (res.url) {
          window.location.href = res.url;
        }
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        alert('Could not initiate checkout. Please try again later.');
      }
    });
  }
}
