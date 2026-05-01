import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { BackgroundAnimationComponent } from './shared/background-animation/background-animation.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BackgroundAnimationComponent],
  template: `
    <app-background-animation></app-background-animation>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
  `,
})
export class App {}
