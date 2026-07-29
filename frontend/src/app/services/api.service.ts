import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { Router } from '@angular/router';

// Unified pending intent for login-then-action flow
export interface PendingIntent {
  action: 'add-to-cart' | 'buy-now';
  type: 'data' | 'service';
  // Data-specific
  recordIds?: string[];
  searchQuery?: string;
  filters?: { city?: string; state?: string; source?: string };
  blockLabel?: string;
  // Service-specific
  tierId?: string;
  tierName?: string;
  projectType?: string;
  discountCode?: string;
}

// Cart item that supports both data blocks and service tiers
export interface CartItem {
  type: 'data' | 'service';
  // Data block fields
  recordIds?: string[];
  searchQuery?: string;
  filters?: { city?: string; state?: string; source?: string };
  blockLabel?: string;
  totalRecords?: number;
  // Service tier fields
  tierId?: string;
  tierName?: string;
  tierDescription?: string;
  projectType?: string;
  price?: number;       // Display price (setup cost for services, block price for data)
  monthlyPrice?: string; // Monthly cost string for service tiers (e.g. "$99/mo")
  // Common
  addedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private router = inject(Router);
  public currentUser = signal<any>(null);
  public dataCart = signal<CartItem[]>([]);
  public cartOpen = signal<boolean>(false);
  public appliedDiscount = signal<{ code: string; percentage: number } | null>(null);

  private readonly apiUrl = '/api';
  private readonly INTENT_KEY = 'phoenix_pending_intent';

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { withCredentials: true });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, { withCredentials: true });
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body, { withCredentials: true });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, { withCredentials: true });
  }

  download(endpoint: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${endpoint}`, { withCredentials: true, responseType: 'blob' });
  }

  // --- Auth Methods ---
  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(user => this.currentUser.set(user))
    );
  }

  // Redirect-based Google Login
  loginWithGoogle(returnTo: string = '/dashboard'): void {
    window.location.href = `${this.apiUrl}/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  }

  checkStatus(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/user`, { withCredentials: true }).pipe(
      tap(user => this.currentUser.set(user)),
      catchError(() => {
        this.currentUser.set(null);
        return of(null);
      })
    );
  }

  logout(): void {
    this.http.get(`${this.apiUrl}/auth/logout`, { withCredentials: true }).subscribe();
    this.currentUser.set(null);
    this.dataCart.set([]);
    sessionStorage.removeItem('checkout_tier');
    sessionStorage.removeItem(this.INTENT_KEY);
    localStorage.removeItem('member_email');
  }

  // --- Unified Pending Intent System ---

  /** Save an intent to sessionStorage before redirecting to login */
  savePendingIntent(intent: PendingIntent): void {
    sessionStorage.setItem(this.INTENT_KEY, JSON.stringify(intent));
  }

  /** Retrieve and clear the pending intent (called after login) */
  getPendingIntent(): PendingIntent | null {
    const raw = sessionStorage.getItem(this.INTENT_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(this.INTENT_KEY);
    // Also clean up legacy keys
    sessionStorage.removeItem('checkout_tier');
    sessionStorage.removeItem('data_cart_intent');
    sessionStorage.removeItem('generic_login');
    try {
      return JSON.parse(raw) as PendingIntent;
    } catch {
      return null;
    }
  }

  /** Clear pending intent without reading */
  clearPendingIntent(): void {
    sessionStorage.removeItem(this.INTENT_KEY);
  }

  /**
   * Ensure the user is logged in, then execute the callback.
   * If not logged in, saves the intent and redirects to login.
   * Returns true if the user IS logged in (callback was called), false if redirected.
   */
  ensureLoggedIn(intent: PendingIntent, returnTo: string = '/services'): boolean {
    if (this.currentUser()) {
      return true; // Already logged in — caller should proceed
    }
    // Save intent and redirect to login
    this.savePendingIntent(intent);
    this.router.navigate(['/services'], { queryParams: { login: 'true' } });
    return false; // Redirected — caller should stop
  }

  // --- Cart Helpers ---

  /** Load cart from backend API */
  loadCart(): void {
    if (!this.currentUser()) return;
    this.get<any>('data-portal/cart').subscribe({
      next: (res) => this.dataCart.set(res.cart || []),
      error: () => {}
    });
  }

  /** Get total item count (number of cart entries — blocks + services) */
  getCartItemCount(): number {
    return this.dataCart().length;
  }

  /** Remove a single item from cart by index */
  removeCartItem(index: number) {
    this.delete<any>(`data-portal/cart/${index}`).subscribe({
      next: (res) => this.dataCart.set(res.cart || []),
      error: () => {}
    });
  }

  /** Clear all items from cart */
  clearCart() {
    this.delete<any>('data-portal/cart').subscribe({
      next: () => this.dataCart.set([]),
      error: () => {}
    });
  }

  /** Toggle the global cart drawer */
  toggleCart() {
    this.cartOpen.update(v => !v);
  }
}
