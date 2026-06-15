import { Component } from '@angular/core';
import { Hero } from '../hero/hero';
import { Services } from '../services/services';
import { Reviews } from '../reviews/reviews';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero, Services, Reviews],
  template: `
    <app-hero></app-hero>
    <app-services></app-services>
    <app-reviews></app-reviews>
  `,
})
export class Home {}
