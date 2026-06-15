import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './support.html',
})
export class Support {
  successMessage = '';

  mockSubmit(event: Event) {
    event.preventDefault();
    this.successMessage = 'Initializing Support Handshake...';
    setTimeout(() => this.successMessage = 'Priority Ticket Successfully Dispatched to Engineering.', 1500);
  }
}
