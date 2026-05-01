import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

import { ServicesComponent } from './services-page/services.component';
import { RegisterComponent } from './register/register.component';
import { TermsComponent } from './legal/terms-of-service.component';
import { RefundPolicyComponent } from './legal/refund-policy.component';

import { CompleteProfileComponent } from './login/complete-profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'complete-profile', component: CompleteProfileComponent },
  { path: 'services', component: ServicesComponent },
  { path: 'terms', component: TermsComponent },
  { path: 'refunds', component: RefundPolicyComponent },
  { path: 'dashboard', component: DashboardComponent },
];
