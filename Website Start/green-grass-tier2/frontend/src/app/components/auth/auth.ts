import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth.html',
})
export class Auth {
  successMessage = '';

  mockLogin(event: Event) {
    event.preventDefault();
    this.successMessage = 'Authenticating Secure Session...';
    setTimeout(() => this.successMessage = 'Dashboard Connection Established.', 1000);
  }
}
