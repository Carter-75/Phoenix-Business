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
    this.successMessage = 'Connecting to agent...';
    setTimeout(() => this.successMessage = 'Your request has been received. A representative will reach out shortly.', 1000);
  }
}
