import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Services } from './components/services/services';
import { Reviews } from './components/reviews/reviews';
import { Support } from './components/support/support';
import { Legal } from './components/legal/legal';
import { Auth } from './components/auth/auth';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'services', component: Services },
  { path: 'reviews', component: Reviews },
  { path: 'support', component: Support },
  { path: 'legal', component: Legal },
  { path: 'auth', component: Auth },
  { path: '**', redirectTo: '' }
];
