import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cart-fab',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Floating Cart Button (top-right, matches AI bot style) -->
    <button *ngIf="cartCount() > 0" (click)="api.toggleCart()" 
            class="fixed top-20 right-6 z-[200] w-14 h-14 bg-orange-600 hover:bg-orange-500 rounded-full shadow-2xl flex items-center justify-center text-white transition-all hover:scale-110 hover:-translate-y-1 cursor-pointer"
            title="View Cart">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      <!-- Badge -->
      <span class="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full bg-orange-500 text-white text-[10px] font-black px-1 shadow-lg shadow-orange-500/40">
        {{ cartCount() }}
      </span>
    </button>
  `
})
export class CartFabComponent {
  api = inject(ApiService);

  cartCount = computed(() => this.api.getCartItemCount());
}
