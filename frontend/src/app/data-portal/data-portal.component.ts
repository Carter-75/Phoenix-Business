import { Component, inject, signal, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { PendingIntent, CartItem } from '../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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

// CartItem imported from ApiService (shared type)

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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './data-portal.component.html',
  styleUrl: './data-portal.component.css'
})
export class DataPortalComponent implements OnInit, OnDestroy {
  // =========================================================================
  // REVERSION TOGGLE (EASY TO REVERT)
  // Set to `true` to re-enable the original Data Blocks Marketplace view.
  // Set to `false` to display Carter's Data Entry & Operations Services showcase.
  // Can also be toggled in real-time by passing ?view=blocks in the URL or using the admin switch.
  // =========================================================================
  showDataBlocks = signal<boolean>(false);

  // Service Packages & Pricing Benchmarks (Researched 2025-2026 Competitive Market Rates)
  readonly dataServiceTiers = [
    {
      id: 'starter',
      title: 'Starter Entry & Conversion',
      tagline: 'Ideal for small business digitization, scanned paperwork & routine list hygiene.',
      hourlyRate: 29,
      flatRate: 129,
      unit: 'Up to 1,000 records or 15 document pages',
      turnaround: '24 - 48 Hours',
      badge: 'Fast Turnaround',
      color: '#34d399',
      features: [
        'High-speed manual typing & data extraction',
        'PDF, physical scans, forms & receipts transcribed to Excel / Sheets',
        'Standardized data formatting (dates, phone numbers, addresses, casing)',
        'Basic deduplication & record sanity validation',
        'Structured delivery (.xlsx, .csv, or Google Sheets)',
        '1 round of verification edits included'
      ]
    },
    {
      id: 'professional',
      title: 'Professional Cleanse & Modeling',
      tagline: 'Deep data cleansing, schema standardization & executive spreadsheet engineering.',
      hourlyRate: 59,
      flatRate: 299,
      unit: 'Up to 5,000 records',
      turnaround: '48 Hours',
      badge: 'Most Popular',
      featured: true,
      color: '#f97316',
      features: [
        'Deep data hygiene, deduplication & address/name normalization',
        'MOS-Certified Excel architecture (XLOOKUP, INDEX/MATCH, dynamic arrays)',
        'Data validation rules, error guards, dropdowns & automated alerts',
        'Word & PowerPoint executive reporting & corporate asset formatting',
        'Human-in-the-loop AI-assisted cross-referencing for 99.9% accuracy',
        '2 full revision cycles + 14-day quality warranty'
      ]
    },
    {
      id: 'enterprise',
      title: 'Enterprise Automation & Pipelines',
      tagline: 'Automated extraction scripts, ETL pipelines & high-volume database migrations.',
      hourlyRate: 95,
      flatRate: 599,
      unit: 'Up to 25,000+ records / recurring batch',
      turnaround: 'Priority 24 - 48 Hours',
      badge: 'High-Volume Scale',
      color: '#818cf8',
      features: [
        'Custom Python & TypeScript data extraction / web scraping scripts',
        'Power Query & automated multi-source synchronization',
        'SQL / MongoDB staging, migration scripts & relational schema design',
        'Complete data hygiene audit report with anomaly flags',
        'Direct developer communication & custom delivery formats',
        'Priority SLAs & ongoing scheduled updates available'
      ]
    }
  ];

  // Core Capabilities
  readonly capabilities = [
    {
      icon: '📊',
      title: 'MOS-Certified Excel Engineering',
      description: 'Advanced workbook architecture, complex lookup formulas (XLOOKUP, INDEX/MATCH), automated dropdowns, conditional logic, and executive Pivot Table dashboards.'
    },
    {
      icon: '🧹',
      title: 'Deep Data Hygiene & Deduplication',
      description: 'Eliminating duplicate entries, repairing broken schemas, normalizing telephone/address/date standards, and validating domains/emails with 99.9% precision.'
    },
    {
      icon: '📄',
      title: 'Document & Receipt Digitization',
      description: 'Accurate transcription from physical paperwork, PDFs, scanned invoices, handwritten notes, and legacy databases into structured digital records.'
    },
    {
      icon: '🗄️',
      title: 'Database Staging & SQL / Mongo ETL',
      description: 'Structuring, migrating, and seeding clean datasets into MongoDB, PostgreSQL, MySQL, or cloud CRMs (HubSpot, Salesforce, Airtable).'
    },
    {
      icon: '📑',
      title: 'Executive Word & PowerPoint Assets',
      description: 'MOS-certified document formatting for board presentations, sales pitch decks, investor tear-sheets, and executive Word documentation.'
    },
    {
      icon: '🤖',
      title: 'AI Prompting & Human-in-the-Loop QA',
      description: 'Accelerated processing using advanced AI prompting techniques paired with rigorous manual verification so zero hallucinated or flawed data slips through.'
    }
  ];

  // Interactive Project Cost & Scope Estimator
  estimatedRecords = signal<number>(2500);
  selectedComplexity = signal<'basic' | 'cleanse' | 'pipeline'>('cleanse');

  calculatedEstimate = computed(() => {
    const records = this.estimatedRecords();
    const comp = this.selectedComplexity();

    if (comp === 'basic') {
      const cost = Math.max(129, Math.round(records * 0.10));
      const hours = Math.max(3, Math.round(records / 300));
      return {
        cost,
        hours,
        turnaround: records > 5000 ? '3 - 4 Days' : '24 - 48 Hours',
        recommendedTier: 'Starter Entry & Conversion'
      };
    } else if (comp === 'cleanse') {
      const cost = Math.max(299, Math.round(records * 0.12));
      const hours = Math.max(5, Math.round(records / 250));
      return {
        cost,
        hours,
        turnaround: records > 8000 ? '4 - 5 Days' : '48 Hours',
        recommendedTier: 'Professional Cleanse & Modeling'
      };
    } else {
      const cost = Math.max(599, Math.round(350 + records * 0.04));
      const hours = Math.max(8, Math.round(records / 1000 + 6));
      return {
        cost,
        hours,
        turnaround: records > 20000 ? '5 - 7 Days' : '2 - 3 Days',
        recommendedTier: 'Enterprise Automation & Pipelines'
      };
    }
  });

  // Inquiry / Contact Modal
  showInquiryModal = signal<boolean>(false);
  inquiryName = '';
  inquiryEmail = '';
  inquiryProjectScope = 'Professional Cleanse & Modeling';
  inquiryRecordCount = '1,000 - 5,000 records';
  inquiryNotes = '';
  inquirySent = signal<boolean>(false);
  copySuccess = signal<boolean>(false);

  openInquiry(tierTitle?: string) {
    if (tierTitle) {
      this.inquiryProjectScope = tierTitle;
    }
    this.inquirySent.set(false);
    this.copySuccess.set(false);
    this.showInquiryModal.set(true);
  }

  closeInquiry() {
    this.showInquiryModal.set(false);
  }

  setRecordsPreset(count: number) {
    this.estimatedRecords.set(count);
  }

  submitInquiry() {
    const subject = encodeURIComponent(`[Data Inquiry] ${this.inquiryProjectScope} (${this.inquiryRecordCount})`);
    const body = encodeURIComponent(
      `Hi Carter,\n\nI'm interested in your Data Entry & Operations services.\n\n` +
      `Client Name: ${this.inquiryName || 'Not provided'}\n` +
      `Contact Email: ${this.inquiryEmail || 'Not provided'}\n` +
      `Selected Package / Scope: ${this.inquiryProjectScope}\n` +
      `Estimated Volume: ${this.inquiryRecordCount}\n\n` +
      `Project Details / Instructions:\n${this.inquiryNotes || 'None specified'}\n\n` +
      `Sent via Phoenix Data Portal`
    );
    window.open(`mailto:partnership@carter-portfolio.fyi?subject=${subject}&body=${body}`, '_blank');
    this.inquirySent.set(true);
  }

  copyInquiryDetails() {
    const text = 
      `Data Operations Inquiry\n` +
      `----------------------\n` +
      `Name: ${this.inquiryName || 'Not provided'}\n` +
      `Email: ${this.inquiryEmail || 'Not provided'}\n` +
      `Scope: ${this.inquiryProjectScope}\n` +
      `Estimated Records: ${this.inquiryRecordCount}\n` +
      `Details: ${this.inquiryNotes || 'None'}\n\n` +
      `Direct Email: partnership@carter-portfolio.fyi`;
    navigator.clipboard.writeText(text).then(() => {
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 3000);
    });
  }

  toggleLegacyDataBlocks() {
    this.showDataBlocks.update(v => !v);
    if (this.showDataBlocks() && this.records().length === 0) {
      this.fetchStats();
      this.search();
    }
  }

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

  // Sync local cart → shared API service cart (for navbar badge)
  private cartSync = effect(() => {
    this.api.dataCart.set(this.cart());
  });
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

  // Reservation system
  reservationExpiresAt = signal<Date | null>(null);
  reservationSecondsLeft = signal(0);
  showReservationModal = signal(false);
  reservationCountdown = signal('');
  reservedRecordIds = signal<string[]>([]);
  showCheckoutReview = signal(false);
  reservationPollingInterval: any = null;
  reservationCountdownInterval: any = null;

  // SSE streaming
  isStreaming = signal(false);
  streamProgress = signal('');
  private eventSource: EventSource | null = null;

  // Error Banner State
  errorMessage = signal<string | null>(null);

  // Tabs
  activeTab = signal<'search' | 'library'>('search');

  ngOnInit() {
    // Support URL query param to easily preview legacy data blocks: /data?view=blocks
    const viewParam = this.route.snapshot.queryParamMap.get('view');
    if (viewParam === 'blocks') {
      this.showDataBlocks.set(true);
    }

    if (!this.showDataBlocks()) {
      this.title.setTitle('Data Operations & Hygiene — Precision Data Entry, Cleaning & Modeling | Carter');
      this.meta.updateTag({ name: 'description', content: 'Professional data entry, spreadsheet engineering, deduplication, and database preparation by Carter. MOS Certified in Excel, Word, and PowerPoint with 99.9% precision.' });
      this.meta.updateTag({ property: 'og:title', content: 'Carter | Professional Data Entry & Operations' });
      this.meta.updateTag({ property: 'og:description', content: 'Transform raw, messy datasets into structured, pristine spreadsheets and databases. Fast turnaround, MOS-certified precision.' });
    } else {
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

      // Fetch dynamic pricing from backend (data blocks mode only)
      this.api.get<any>('stripe/pricing').subscribe({
        next: (pricing) => {
          const rawCents = pricing.basePrices?.data || 24900;
          const discount = pricing.discountPercentage || 0;
          this.basePrice.set(Math.round(rawCents / 100));
          this.discountPercent.set(discount);
          const discounted = Math.round(rawCents * (1 - discount / 100));
          this.pricePerBlock.set(Math.round(discounted / 100));
        },
        error: (err) => {
          console.warn('Data Portal: Could not fetch pricing from server, using defaults.', err);
        }
      });

      // Load user-specific data if logged in
      if (this.api.currentUser()) {
        this.loadCart();
        this.loadSavedSearches();
        if (this.activeTab() === 'library') {
          this.loadPurchases();
        }
        // Resume pending intent after login redirect
        this.resumePendingIntent();
      }
    }
  }

  /** Resume a pending intent that was saved before login redirect */
  private resumePendingIntent() {
    const intent = this.api.getPendingIntent();
    if (!intent || intent.type !== 'data') return;

    if (intent.action === 'add-to-cart' && intent.recordIds?.length) {
      // Auto-add the block to cart
      const label = [
        intent.searchQuery || 'All records',
        intent.filters?.city ? `in ${intent.filters.city}` : '',
        intent.filters?.state ? `, ${intent.filters.state}` : '',
        intent.filters?.source ? `(${intent.filters.source})` : ''
      ].filter(Boolean).join(' ');

      this.api.post('data-portal/cart/add', {
        recordIds: intent.recordIds,
        searchQuery: intent.searchQuery || '',
        filters: intent.filters || {},
        blockLabel: intent.blockLabel || label
      }).subscribe({
        next: (res: any) => {
          this.cart.set(res.cart || []);
          this.cartOpen.set(true);
        },
        error: () => {}
      });
    } else if (intent.action === 'buy-now' && intent.recordIds?.length) {
      // Auto-start checkout with these records
      this.buyNowWithIds(intent.recordIds);
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
    const hasActiveFilters = this.searchQuery || this.cityFilter || this.stateFilter || this.sourceFilter;

    // Use SSE streaming for active user searches, regular API for initial load
    if (hasActiveFilters && page === 1) {
      this.searchStream();
      return;
    }

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

  /** SSE progressive search — streams records one-by-one from backend */
  searchStream() {
    // Close any existing stream
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.isLoading.set(true);
    this.isStreaming.set(true);
    this.records.set([]);
    this.streamProgress.set('Searching database...');

    const params = new URLSearchParams();
    params.set('limit', '20');
    if (this.searchQuery) params.set('q', this.searchQuery);
    if (this.cityFilter) params.set('city', this.cityFilter);
    if (this.stateFilter) params.set('state', this.stateFilter);
    if (this.sourceFilter) params.set('source', this.sourceFilter);

    const url = `/api/data-portal/search-stream?${params.toString()}`;
    this.eventSource = new EventSource(url);

    const allIds: string[] = [];

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'record') {
          this.records.update(current => [...current, data.record]);
          allIds.push(data.record._id);
          this.blockRecordIds.set([...allIds]);
          this.blockSize.set(allIds.length);
          this.isLoading.set(false); // Show results as soon as first record arrives
        } else if (data.type === 'progress') {
          this.streamProgress.set(data.message || '');
          if (data.phase === 'fetching') {
            this.streamProgress.set('Fetching live public data...');
          }
        } else if (data.type === 'done') {
          this.isStreaming.set(false);
          this.isLoading.set(false);
          this.streamProgress.set('');
          this.totalPages.set(1);
          this.currentPage.set(1);
          this.eventSource?.close();
          this.eventSource = null;
        } else if (data.type === 'error') {
          console.error('Data stream error from server:', data.message || 'Stream error');
          this.errorMessage.set(data.message || 'Live data search stream was interrupted. Please try again.');
          this.isStreaming.set(false);
          this.isLoading.set(false);
          this.streamProgress.set('');
          this.eventSource?.close();
          this.eventSource = null;
        }
      } catch (e) {
        // Parse error — ignore
      }
    };

    this.eventSource.onerror = (err) => {
      console.error('Data stream connection error occurred:', err);
      this.errorMessage.set('Live data stream connection was lost. Please check your network or try again.');
      this.isStreaming.set(false);
      this.isLoading.set(false);
      this.streamProgress.set('');
      this.eventSource?.close();
      this.eventSource = null;
    };
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
    const intent: PendingIntent = {
      action: 'add-to-cart',
      type: 'data',
      recordIds: this.blockRecordIds(),
      searchQuery: this.searchQuery,
      filters: { city: this.cityFilter, state: this.stateFilter, source: this.sourceFilter },
      blockLabel: this.buildBlockLabel()
    };

    if (!this.api.ensureLoggedIn(intent, '/data')) return;

    this.cartLoading.set(true);
    this.api.post('data-portal/cart/add', {
      recordIds: intent.recordIds,
      searchQuery: intent.searchQuery,
      filters: intent.filters,
      blockLabel: intent.blockLabel
    }).subscribe({
      next: (res: any) => {
        this.cart.set(res.cart || []);
        this.cartLoading.set(false);
        this.cartOpen.set(true);
      },
      error: () => this.cartLoading.set(false)
    });
  }

  /** Buy Now: skip cart, go straight to checkout review with current block */
  buyNow() {
    const intent: PendingIntent = {
      action: 'buy-now',
      type: 'data',
      recordIds: this.blockRecordIds(),
      searchQuery: this.searchQuery,
      filters: { city: this.cityFilter, state: this.stateFilter, source: this.sourceFilter },
      blockLabel: this.buildBlockLabel()
    };

    if (!this.api.ensureLoggedIn(intent, '/data')) return;

    this.buyNowWithIds(intent.recordIds!);
  }

  /** Internal: start checkout reservation for specific record IDs */
  private buyNowWithIds(recordIds: string[]) {
    this.checkoutLoading.set(true);
    this.api.post<any>('data-portal/reserve', { recordIds }).subscribe({
      next: (res) => {
        this.reservedRecordIds.set(res.reservedRecords || []);
        this.reservationExpiresAt.set(new Date(res.expiresAt));
        this.reservationSecondsLeft.set(res.secondsRemaining);
        this.showCheckoutReview.set(true);
        this.checkoutLoading.set(false);
        this.startReservationCountdown();
        this.startReservationPolling();
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        if (err.status === 409) {
          alert('Some records are already reserved by another user. Please try again.');
        } else {
          alert('Failed to reserve records. Please try again.');
        }
      }
    });
  }

  /** Build a human-readable label for the current search block */
  private buildBlockLabel(): string {
    return [
      this.searchQuery || 'All records',
      this.cityFilter ? `in ${this.cityFilter}` : '',
      this.stateFilter ? `, ${this.stateFilter}` : '',
      this.sourceFilter ? `(${this.sourceFilter})` : ''
    ].filter(Boolean).join(' ');
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

  /** Initiate checkout: reserve records first, then show review screen */
  checkout() {
    if (!this.api.ensureLoggedIn({ action: 'buy-now', type: 'data' }, '/data')) return;

    if (this.cart().length === 0) return;

    this.checkoutLoading.set(true);

    // Collect all record IDs from cart
    const allIds: string[] = [];
    for (const block of this.cart()) {
      allIds.push(...(block.recordIds || []));
    }

    // Reserve records first
    this.api.post<any>('data-portal/reserve', { recordIds: allIds }).subscribe({
      next: (res) => {
        this.reservedRecordIds.set(res.reservedRecords || []);
        this.reservationExpiresAt.set(new Date(res.expiresAt));
        this.reservationSecondsLeft.set(res.secondsRemaining);
        this.showCheckoutReview.set(true);
        this.checkoutLoading.set(false);
        this.startReservationCountdown();
        this.startReservationPolling();
      },
      error: (err) => {
        this.checkoutLoading.set(false);
        if (err.status === 409) {
          alert('Some records are already reserved by another user. Please remove them from your cart and try again.');
        } else {
          alert('Failed to reserve records. Please try again.');
        }
      }
    });
  }

  /** Proceed from review screen to actual Stripe checkout */
  proceedToPayment() {
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

  /** Start the countdown timer for the reservation */
  startReservationCountdown() {
    this.clearCountdownInterval();
    this.reservationCountdownInterval = setInterval(() => {
      const expiresAt = this.reservationExpiresAt();
      if (!expiresAt) return;

      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      this.reservationSecondsLeft.set(remaining);

      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      this.reservationCountdown.set(`${mins}:${secs.toString().padStart(2, '0')}`);

      // Show forced modal at 60 seconds
      if (remaining <= 60 && remaining > 0 && this.showCheckoutReview()) {
        this.showReservationModal.set(true);
      }

      // Reservation expired
      if (remaining <= 0) {
        this.handleReservationExpired();
      }
    }, 1000);
  }

  /** Poll backend for authoritative reservation status */
  startReservationPolling() {
    this.clearPollingInterval();
    this.reservationPollingInterval = setInterval(() => {
      this.api.get<any>('data-portal/reserve/status').subscribe({
        next: (res) => {
          if (!res.hasReservation) {
            this.handleReservationExpired();
          } else {
            this.reservationSecondsLeft.set(res.secondsRemaining);
            this.reservationExpiresAt.set(new Date(res.expiresAt));
          }
        },
        error: () => {}
      });
    }, 30000); // Poll every 30 seconds
  }

  /** Extend the reservation by +10 minutes */
  extendReservation() {
    this.api.post<any>('data-portal/reserve/extend', {
      recordIds: this.reservedRecordIds()
    }).subscribe({
      next: (res) => {
        this.reservationExpiresAt.set(new Date(res.expiresAt));
        this.reservationSecondsLeft.set(res.secondsRemaining);
        this.showReservationModal.set(false);
      },
      error: () => {
        alert('Failed to extend reservation.');
      }
    });
  }

  /** Abandon the reservation and exit checkout */
  abandonReservation() {
    this.api.post<any>('data-portal/reserve/abandon', {
      recordIds: this.reservedRecordIds()
    }).subscribe({
      next: () => this.exitCheckout(),
      error: () => this.exitCheckout()
    });
  }

  /** Handle reservation expiry (timer hit 0 or backend says no reservation) */
  handleReservationExpired() {
    this.showReservationModal.set(false);
    this.exitCheckout();
  }

  /** Exit the checkout review screen and clean up */
  exitCheckout() {
    this.showCheckoutReview.set(false);
    this.showReservationModal.set(false);
    this.reservedRecordIds.set([]);
    this.reservationExpiresAt.set(null);
    this.reservationSecondsLeft.set(0);
    this.reservationCountdown.set('');
    this.clearCountdownInterval();
    this.clearPollingInterval();
  }

  private clearCountdownInterval() {
    if (this.reservationCountdownInterval) {
      clearInterval(this.reservationCountdownInterval);
      this.reservationCountdownInterval = null;
    }
  }

  private clearPollingInterval() {
    if (this.reservationPollingInterval) {
      clearInterval(this.reservationPollingInterval);
      this.reservationPollingInterval = null;
    }
  }

  ngOnDestroy() {
    this.clearCountdownInterval();
    this.clearPollingInterval();
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
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
      case 'sec-filings': return 'SEC Filing';
      default: return sourceType;
    }
  }
}
