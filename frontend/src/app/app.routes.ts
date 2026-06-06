import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AboutComponent } from './about/about.component';
import { ServicesComponent } from './services-page/services.component';
import { TermsComponent } from './legal/terms-of-service.component';
import { RefundPolicyComponent } from './legal/refund-policy.component';
import { PrivacyPolicyComponent } from './legal/privacy-policy.component';
import { DashboardComponent } from './dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'about', component: AboutComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'refunds', component: RefundPolicyComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
  { path: 'dashboard', component: DashboardComponent },
  
  { path: '**', redirectTo: 'home' }
];
