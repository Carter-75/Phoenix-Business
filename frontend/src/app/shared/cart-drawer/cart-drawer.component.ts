import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService, CartItem } from '../../services/api.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Overlay -->
    <div class="cart-overlay" [class.open]="api.cartOpen()" (click)="api.toggleCart()"></div>

    <!-- Slide-out Panel -->
    <div class="cart-panel" [class.open]="api.cartOpen()">
      <div class="cart-header">
        <h3>Your Cart</h3>
        <button (click)="api.toggleCart()" class="cart-close">✕</button>
      </div>

      <!-- Empty State -->
      <div *ngIf="cartItems().length === 0" class="cart-empty">
        <p class="cart-empty-icon">🛒</p>
        <p>Your cart is empty</p>
        <p class="cart-empty-sub">Add data blocks or service plans to get started</p>
      </div>

      <!-- Cart Items -->
      <div *ngIf="cartItems().length > 0" class="cart-items">
        <div *ngFor="let item of cartItems(); let i = index" class="cart-item">
          <div class="cart-item-info">
            <!-- Data block -->
            <ng-container *ngIf="item.type !== 'service'">
              <p class="cart-item-label">{{ item.blockLabel || 'Data Block' }}</p>
              <p class="cart-item-count">{{ item.totalRecords || (item.recordIds?.length || 0) }} records</p>
            </ng-container>
            <!-- Service tier -->
            <ng-container *ngIf="item.type === 'service'">
              <p class="cart-item-label">{{ item.tierName || 'Service Plan' }}</p>
              <p class="cart-item-count" *ngIf="item.monthlyPrice">{{ item.monthlyPrice }}</p>
              <p class="cart-item-count" *ngIf="!item.monthlyPrice">Service Plan</p>
            </ng-container>
          </div>
          <div class="cart-item-actions">
            <span class="cart-item-price" *ngIf="item.price">\${{ item.price }}</span>
            <span class="cart-item-price" *ngIf="!item.price && item.type !== 'service'">\${{ dataBlockPrice() }}</span>
            <button (click)="removeItem(i)" class="cart-item-remove">✕</button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div *ngIf="cartItems().length > 0" class="cart-footer">
        <button (click)="proceedToCheckout()" class="cart-checkout-btn">
          Proceed to Checkout
        </button>
        <button (click)="clearAll()" class="cart-clear-btn">Clear Cart</button>
      </div>
    </div>
  `,
  styles: [`
    .cart-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 200;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s;
    }
    .cart-overlay.open {
      opacity: 1;
      pointer-events: auto;
    }
    .cart-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 420px;
      max-width: 90vw;
      height: 100vh;
      background: #0a0a0f;
      border-left: 1px solid rgba(255,255,255,0.1);
      z-index: 201;
      display: flex;
      flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.3s ease;
    }
    .cart-panel.open {
      transform: translateX(0);
    }
    .cart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .cart-header h3 {
      font-size: 18px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: white;
    }
    .cart-close {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,0.05);
      border: none;
      color: rgba(255,255,255,0.4);
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
    }
    .cart-close:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }
    .cart-empty {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: rgba(255,255,255,0.3);
      font-size: 14px;
    }
    .cart-empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.3;
    }
    .cart-empty-sub {
      font-size: 11px;
      color: rgba(255,255,255,0.15);
      margin-top: 4px;
    }
    .cart-items {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    .cart-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-radius: 14px;
      background: rgba(255,255,255,0.02);
      border: 1px solid rgba(255,255,255,0.05);
      margin-bottom: 8px;
      transition: all 0.2s;
    }
    .cart-item:hover {
      border-color: rgba(255,255,255,0.1);
    }
    .cart-item-info {
      flex: 1;
      min-width: 0;
    }
    .cart-item-label {
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: white;
    }
    .cart-item-count {
      font-size: 10px;
      color: rgba(255,255,255,0.3);
      margin-top: 2px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 700;
    }
    .cart-item-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: 12px;
    }
    .cart-item-price {
      font-size: 16px;
      font-weight: 900;
      color: #ea580c;
    }
    .cart-item-remove {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: rgba(239,68,68,0.08);
      border: none;
      color: rgba(239,68,68,0.5);
      cursor: pointer;
      font-size: 11px;
      transition: all 0.2s;
    }
    .cart-item-remove:hover {
      background: rgba(239,68,68,0.15);
      color: #ef4444;
    }
    .cart-footer {
      padding: 20px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .cart-checkout-btn {
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      background: linear-gradient(135deg, #ea580c, #d97706);
      border: none;
      color: white;
      font-size: 12px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 8px;
    }
    .cart-checkout-btn:hover {
      box-shadow: 0 8px 30px rgba(234,88,12,0.4);
      transform: translateY(-1px);
    }
    .cart-clear-btn {
      width: 100%;
      padding: 10px;
      border-radius: 10px;
      background: transparent;
      border: 1px solid rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.25);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .cart-clear-btn:hover {
      background: rgba(239,68,68,0.05);
      border-color: rgba(239,68,68,0.2);
      color: #ef4444;
    }
    @media (max-width: 640px) {
      .cart-panel { width: 100vw; max-width: 100vw; }
    }
  `]
})
export class CartDrawerComponent {
  api = inject(ApiService);
  private router = inject(Router);

  cartItems = computed(() => this.api.dataCart());
  dataBlockPrice = computed(() => 137); // Default; could be fetched dynamically

  removeItem(index: number) {
    this.api.removeCartItem(index);
  }

  clearAll() {
    this.api.clearCart();
  }

  proceedToCheckout() {
    this.api.toggleCart();
    this.router.navigate(['/checkout']);
  }
}
