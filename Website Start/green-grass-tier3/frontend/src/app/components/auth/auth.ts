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
    this.successMessage = 'Authenticating Secure Local Session...';
    setTimeout(() => this.successMessage = 'Dashboard Connection Established.', 1000);
  }

  mockOAuth(event: Event, provider: string) {
    event.preventDefault();
    this.successMessage = `Negotiating Enterprise SSO via ${provider}...`;
    setTimeout(() => this.successMessage = 'SSO Handshake Complete.', 1000);
  }
}
