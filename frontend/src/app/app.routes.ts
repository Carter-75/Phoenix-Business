import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services-page/services.component';
import { TermsComponent } from './legal/terms-of-service.component';
import { RefundPolicyComponent } from './legal/refund-policy.component';
import { PrivacyPolicyComponent } from './legal/privacy-policy.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { LeaveReviewComponent } from './leave-review/leave-review.component';
import { AdminReviewsComponent } from './admin-reviews/admin-reviews.component';
import { ReviewsComponent } from './reviews/reviews.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'website-audit', component: HomeComponent },
  { path: 'painting-websites', component: HomeComponent },
  { path: 'growth-crm', loadComponent: () => import('./growth-crm/growth-crm.component').then(m => m.GrowthCrmComponent) },
  { path: 'data-cleanup', loadComponent: () => import('./data-cleanup/data-cleanup.component').then(m => m.DataCleanupComponent) },
  { path: 'about', component: AboutComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'refunds', component: RefundPolicyComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
  { path: 'checkout-success', loadComponent: () => import('./checkout-success/checkout-success.component').then(m => m.CheckoutSuccessComponent) },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'leave-review', component: LeaveReviewComponent },
  { path: 'leave-review/:token', component: LeaveReviewComponent },
  { path: 'reviews', component: ReviewsComponent },
  { path: 'admin-reviews', component: AdminReviewsComponent },
  
  // Data Intelligence Portal — public, shareable links
  { path: 'data', redirectTo: 'data-cleanup', pathMatch: 'full' },
  { 
    path: 'data/:id', 
    loadComponent: () => import('./data-portal/data-portal.component').then(m => m.DataPortalComponent)
  },

  // Checkout Review — full page
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.component').then(m => m.CheckoutComponent)
  },

  { path: '**', redirectTo: 'home' }
];
