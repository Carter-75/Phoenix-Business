import { Routes } from '@angular/router';

export const routes: Routes = [
  // Canonical Homepage
  { 
    path: '', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent), 
    pathMatch: 'full' 
  },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  
  // Legacy aliases / landing shortcuts
  { 
    path: 'website-audit', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) 
  },
  { 
    path: 'painting-websites', 
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) 
  },

  // Dedicated Services
  { 
    path: 'services', 
    loadComponent: () => import('./services-page/services.component').then(m => m.ServicesComponent) 
  },
  { 
    path: 'services/custom-websites', 
    loadComponent: () => import('./services-page/custom-websites.component').then(m => m.CustomWebsitesComponent) 
  },
  { path: 'custom-websites', redirectTo: 'services/custom-websites', pathMatch: 'full' },
  { path: 'custom-website-development', redirectTo: 'services/custom-websites', pathMatch: 'full' },
  
  { 
    path: 'services/automation', 
    loadComponent: () => import('./services-page/automation.component').then(m => m.AutomationComponent) 
  },
  { path: 'automation', redirectTo: 'services/automation', pathMatch: 'full' },

  { 
    path: 'services/ai-solutions', 
    loadComponent: () => import('./services-page/ai-solutions.component').then(m => m.AiSolutionsComponent) 
  },
  { path: 'ai-solutions', redirectTo: 'services/ai-solutions', pathMatch: 'full' },

  { 
    path: 'data-cleanup', 
    loadComponent: () => import('./data-cleanup/data-cleanup.component').then(m => m.DataCleanupComponent) 
  },

  // Company & Verification
  { 
    path: 'about', 
    loadComponent: () => import('./about/about.component').then(m => m.AboutComponent) 
  },
  { 
    path: 'reviews', 
    loadComponent: () => import('./reviews/reviews.component').then(m => m.ReviewsComponent) 
  },
  { 
    path: 'leave-review', 
    loadComponent: () => import('./leave-review/leave-review.component').then(m => m.LeaveReviewComponent) 
  },
  { 
    path: 'leave-review/:token', 
    loadComponent: () => import('./leave-review/leave-review.component').then(m => m.LeaveReviewComponent) 
  },

  // Legal
  { 
    path: 'terms', 
    loadComponent: () => import('./legal/terms-of-service.component').then(m => m.TermsComponent) 
  },
  { 
    path: 'refunds', 
    loadComponent: () => import('./legal/refund-policy.component').then(m => m.RefundPolicyComponent) 
  },
  { 
    path: 'privacy', 
    loadComponent: () => import('./legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent) 
  },

  // Customer Management & Intake (Protected / Excluded from Indexing)
  { 
    path: 'growth-crm', 
    loadComponent: () => import('./growth-crm/growth-crm.component').then(m => m.GrowthCrmComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./dashboard/dashboard.component').then(m => m.DashboardComponent) 
  },
  { 
    path: 'admin-reviews', 
    loadComponent: () => import('./admin-reviews/admin-reviews.component').then(m => m.AdminReviewsComponent) 
  },
  { 
    path: 'checkout', 
    loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent) 
  },
  { 
    path: 'checkout-success', 
    loadComponent: () => import('./checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent) 
  },
  { path: 'data', redirectTo: 'data-cleanup', pathMatch: 'full' },
  { 
    path: 'data/:id', 
    loadComponent: () => import('./data-portal/data-portal.component').then(m => m.DataPortalComponent) 
  },

  // Wildcard fallback to canonical home
  { path: '**', redirectTo: '' }
];
