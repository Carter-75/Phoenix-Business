import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { BackgroundAnimationComponent } from './shared/background-animation/background-animation.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, BackgroundAnimationComponent, FooterComponent],
  template: `
    <app-background-animation></app-background-animation>
    <div class="fire-container">
      <div class="fire-bar" style="left: 10%; animation-delay: 0s;"></div>
      <div class="fire-bar" style="left: 30%; animation-delay: -2s;"></div>
      <div class="fire-bar" style="left: 50%; animation-delay: -5s;"></div>
      <div class="fire-bar" style="left: 70%; animation-delay: -1s;"></div>
      <div class="fire-bar" style="left: 90%; animation-delay: -7s;"></div>
    </div>
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `,
})
export class App {}
