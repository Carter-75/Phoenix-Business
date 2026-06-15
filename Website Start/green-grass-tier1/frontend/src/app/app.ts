import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Nav } from './components/nav/nav';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Nav, Footer],
  template: `
    <main class="min-h-screen bg-gg-bg selection:bg-gg-primary selection:text-white flex flex-col">
      <app-nav></app-nav>
      <div class="flex-grow">
        <router-outlet></router-outlet>
      </div>
      <app-footer></app-footer>
    </main>
  `,
})
export class App {}
