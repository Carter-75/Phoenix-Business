import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { ApiService } from '../services/api.service';

interface PortalRecord {
  _id: string;
  companyName: string;
  projectType: string;
  estimatedBudget: number;
  city: string;
  state: string;
  tags: string[];
  summary: string;
  sourceType: string;
  date: string;
  hasContact: boolean;
  hasPhone: boolean;
  portalUrl: string;
}

interface CartItem {
  recordIds: string[];
  searchQuery: string;
  filters: { city: string; state: string; source: string };
  blockLabel: string;
  totalRecords: number;
  addedAt: string;
}

interface SavedSearch {
  query: string;
  city: string;
  state: string;
  source: string;
  label: string;
  createdAt: string;
}

interface DataPurchase {
  _id: string;
  searchQuery: string;
  filters: any;
  blockLabel: string;
  totalRecords: number;
  amountPaid: number;
  paidAt: string;
  status: string;
}

@Component({
  selector: 'app-data-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-portal.component.html',
  styleUrl: './data-portal.component.css'
})
export class DataPortalComponent implements OnInit {
  public api = inject(ApiService);
  private meta = inject(Meta);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Search
  records = signal<PortalRecord[]>([]);
  stats = signal<any>(null);
  isLoading = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  blockRecordIds = signal<string[]>([]); // IDs for "Add Block to Cart"
  blockSize = signal(0);

  // Single record view
  singleRecord = signal<any>(null);
  showSingleView = signal(false);

  // Filters
  searchQuery = '';
  cityFilter = '';
  stateFilter = '';
  sourceFilter = '';

  // Cart
  cart = signal<CartItem[]>([]);
  cartOpen = signal(false);
  cartLoading = signal(false);
  pricePerBlock = signal(249); // Default, updated from backend
  basePrice = signal(249); // Pre-discount price
  discountPercent = signal(0);
  cartTotalPrice = computed(() => this.cart().length * this.pricePerBlock());

  // Saved searches
  savedSearches = signal<SavedSearch[]>([]);
  savedSearchesOpen = signal(false);
  searchSaveSuccess = signal(false);

  // Library (purchases)
  purchases = signal<DataPurchase[]>([]);
  purchaseRecords = signal<any[]>([]); // Full records for a selected purchase
  selectedPurchase = signal<DataPurchase | null>(null);
  showLibrary = signal(false);

  // Checkout
  checkoutLoading = signal(false);
  discountCode = '';

  // Tabs
  activeTab = signal<'search' | 'library'>('search');

  ngOnInit() {
    this.title.setTitle('Data Intelligence — AI-Enriched Public Records | Phoenix');
    this.meta.updateTag({ name: 'description', content: 'Search AI-enriched building permits, government contracts, and public records. Real-time data intelligence for businesses. One-time purchase, instant access.' });
    this.meta.updateTag({ property: 'og:title', content: 'Phoenix Data Intelligence' });
    this.meta.updateTag({ property: 'og:description', content: 'AI-enriched public records for businesses. Building permits, government contracts, and more.' });

    // Check for purchase success redirect
    const purchaseSuccess = this.route.snapshot.queryParamMap.get('purchase');
    if (purchaseSuccess === 'success') {
      this.activeTab.set('library');
      this.router.navigate([], { replaceUrl: true, queryParams: {} });
    }

    // Check if there's a record ID in the route (shareable link: /data/:id)
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadSingleRecord(recordId);
    } else {
      this.fetchStats();
      this.search();
    }

    // Fetch dynamic pricing from backend
    this.api.get<any>('stripe/pricing').subscribe({
      next: (pricing) => {
        const rawCents = pricing.basePrices?.data || 24900;
        const discount = pricing.discountPercentage || 0;
        this.basePrice.set(Math.round(rawCents / 100));
        this.discountPercent.set(discount);
        const discounted = Math.round(rawCents * (1 - discount / 100));
        this.pricePerBlock.set(Math.round(discounted / 100));
      },
      error: () => {} // Fallback to default
    });

    // Load user-specific data if logged in
    if (this.api.currentUser()) {
      this.loadCart();
      this.loadSavedSearches();
      if (this.activeTab() === 'library') {
        this.loadPurchases();
      }
    }
  }

  // ---- Search ----

  fetchStats() {
    this.api.get<any>('data-portal/stats').subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {}
    });
  }

  search(page = 1) {
    this.isLoading.set(true);
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', '20');
    if (this.searchQuery) params.set('q', this.searchQuery);
    if (this.cityFilter) params.set('city', this.cityFilter);
    if (this.stateFilter) params.set('state', this.stateFilter);
    if (this.sourceFilter) params.set('source', this.sourceFilter);

    this.api.get<any>(`data-portal/search?${params.toString()}`).subscribe({
      next: (res) => {
        this.records.set(res.records);
        this.blockRecordIds.set(res.blockRecordIds || []);
        this.blockSize.set(res.blockSize || 0);
        this.totalPages.set(res.pagination.pages);
        this.currentPage.set(res.pagination.page);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  clearFilters() {
    this.searchQuery = '';
    this.cityFilter = '';
    this.stateFilter = '';
    this.sourceFilter = '';
    this.search(1);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.search(page);
    }
  }

  // ---- Single Record View ----

  loadSingleRecord(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`data-portal/record/${id}`).subscribe({
      next: (record) => {
        this.singleRecord.set(record);
        this.showSingleView.set(true);
        this.isLoading.set(false);
        this.title.setTitle(`${record.companyName} — ${record.projectType} | Phoenix Data Intelligence`);
        this.meta.updateTag({ name: 'description', content: record.executiveSummary || `AI-enriched record for ${record.companyName}` });
      },
      error: () => {
        this.isLoading.set(false);
        this.search();
      }
    });
  }

  viewRecord(record: PortalRecord) {
    this.loadSingleRecord(record._id);
  }

  backToSearch() {
    this.showSingleView.set(false);
    this.singleRecord.set(null);
    this.search();
  }

  // ---- Cart ----

  loadCart() {
    this.api.get<any>('data-portal/cart').subscribe({
      next: (res) => this.cart.set(res.cart || []),
      error: () => {}
    });
  }

  addToCart() {
    if (!this.api.currentUser()) {
      // Save intent and redirect to login flow
      sessionStorage.setItem('data_cart_intent', JSON.stringify({
        recordIds: this.blockRecordIds(),
        searchQuery: this.searchQuery,
        filters: { city: this.cityFilter, state: this.stateFilter, source: this.sourceFilter }
      }));
      sessionStorage.setItem('checkout_tier', 'data');
      this.router.navigate(['/services'], { queryParams: { login: 'true' } });
      return;
    }

    this.cartLoading.set(true);
    const label = [
      this.searchQuery || 'All records',
      this.cityFilter ? `in ${this.cityFilter}` : '',
      this.stateFilter ? `, ${this.stateFilter}` : '',
      this.sourceFilter ? `(${this.sourceFilter})` : ''
    ].filter(Boolean).join(' ');

    this.api.post('data-portal/cart/add', {
      recordIds: this.blockRecordIds(),
      searchQuery: this.searchQuery,
      filters: { city: this.cityFilter, state: this.stateFilter, source: this.sourceFilter },
      blockLabel: label
    }).subscribe({
      next: (res: any) => {
        this.cart.set(res.cart || []);
        this.cartLoading.set(false);
        this.cartOpen.set(true);
      },
      error: () => this.cartLoading.set(false)
    });
  }

  removeFromCart(index: number) {
    this.api.delete(`data-portal/cart/${index}`).subscribe({
      next: (res: any) => this.cart.set(res.cart || []),
      error: () => {}
    });
  }

  clearCart() {
    this.api.delete('data-portal/cart').subscribe({
      next: () => this.cart.set([]),
      error: () => {}
    });
  }

  toggleCart() {
    this.cartOpen.update(v => !v);
  }

  // ---- Checkout ----

  checkout() {
    if (!this.api.currentUser()) {
      sessionStorage.setItem('checkout_tier', 'data');
      this.router.navigate(['/services'], { queryParams: { login: 'true' } });
      return;
    }

    if (this.cart().length === 0) return;

    this.checkoutLoading.set(true);
    const user = this.api.currentUser();

    this.api.post<{url: string}>('stripe/checkout', {
      tier: 'data',
      email: user?.email,
      name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      businessName: user?.businessName || '',
      acceptedContract: true,
      contractTimestamp: new Date().toISOString(),
      projectType: 'Data Intelligence',
      cartItems: this.cart(),
      discountCode: this.discountCode || undefined
    }).subscribe({
      next: (res) => {
        window.open(res.url, '_blank');
        this.checkoutLoading.set(false);
      },
      error: () => {
        this.checkoutLoading.set(false);
        alert('Failed to initialize checkout. Please try again.');
      }
    });
  }

  // ---- Saved Searches ----

  loadSavedSearches() {
    this.api.get<any>('data-portal/saved-searches').subscribe({
      next: (res) => this.savedSearches.set(res.savedSearches || []),
      error: () => {}
    });
  }

  saveSearch() {
    if (!this.api.currentUser()) {
      sessionStorage.setItem('checkout_tier', 'data');
      this.router.navigate(['/services'], { queryParams: { login: 'true' } });
      return;
    }

    this.api.post('data-portal/save-search', {
      query: this.searchQuery,
      city: this.cityFilter,
      state: this.stateFilter,
      source: this.sourceFilter
    }).subscribe({
      next: (res: any) => {
        this.savedSearches.set(res.savedSearches || []);
        this.searchSaveSuccess.set(true);
        setTimeout(() => this.searchSaveSuccess.set(false), 2000);
      },
      error: () => {}
    });
  }

  loadSavedSearch(s: SavedSearch) {
    this.searchQuery = s.query;
    this.cityFilter = s.city;
    this.stateFilter = s.state;
    this.sourceFilter = s.source;
    this.savedSearchesOpen.set(false);
    this.search(1);
  }

  deleteSavedSearch(index: number) {
    this.api.delete(`data-portal/saved-searches/${index}`).subscribe({
      next: (res: any) => this.savedSearches.set(res.savedSearches || []),
      error: () => {}
    });
  }

  // ---- Library (Purchases) ----

  switchTab(tab: 'search' | 'library') {
    this.activeTab.set(tab);
    if (tab === 'library' && this.api.currentUser()) {
      this.loadPurchases();
    }
  }

  loadPurchases() {
    this.api.get<any>('data-portal/purchases').subscribe({
      next: (res) => this.purchases.set(res.purchases || []),
      error: () => {}
    });
  }

  viewPurchase(purchase: DataPurchase) {
    this.selectedPurchase.set(purchase);
    this.api.get<any>(`data-portal/purchases/${purchase._id}`).subscribe({
      next: (res) => this.purchaseRecords.set(res.records || []),
      error: () => {}
    });
  }

  closePurchaseDetail() {
    this.selectedPurchase.set(null);
    this.purchaseRecords.set([]);
  }

  // ---- Helpers ----

  formatBudget(amount: number): string {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount.toFixed(0)}`;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getSourceLabel(sourceType: string): string {
    switch (sourceType) {
      case 'building-permits': return 'Building Permit';
      case 'gov-contracts': return 'Gov Contract';
      default: return sourceType;
    }
  }
}
