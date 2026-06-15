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
    this.successMessage = 'Transmitting data...';
    setTimeout(() => this.successMessage = 'Support Ticket Received. We will contact you soon.', 1000);
  }
}
