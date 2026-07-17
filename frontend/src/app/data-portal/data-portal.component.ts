import { Component, inject, signal, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-data-portal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-portal.component.html',
  styleUrl: './data-portal.component.css'
})
export class DataPortalComponent implements OnInit {
  private api = inject(ApiService);
  private meta = inject(Meta);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  records = signal<PortalRecord[]>([]);
  stats = signal<any>(null);
  isLoading = signal(false);
  totalPages = signal(1);
  currentPage = signal(1);
  
  // Single record view mode
  singleRecord = signal<any>(null);
  showSingleView = signal(false);
  
  // Upgrade modal
  showUpgradeModal = signal(false);

  // Search
  searchQuery = '';
  cityFilter = '';
  stateFilter = '';
  sourceFilter = '';

  ngOnInit() {
    this.title.setTitle('Data Intelligence — AI-Enriched Public Records | Phoenix');
    this.meta.updateTag({ name: 'description', content: 'Search AI-enriched building permits, government contracts, and public records. Real-time data intelligence for businesses. One-time purchase, instant access.' });
    this.meta.updateTag({ property: 'og:title', content: 'Phoenix Data Intelligence' });
    this.meta.updateTag({ property: 'og:description', content: 'AI-enriched public records for businesses. Building permits, government contracts, and more.' });

    // Check if there's a record ID in the route (shareable link: /data/:id)
    const recordId = this.route.snapshot.paramMap.get('id');
    if (recordId) {
      this.loadSingleRecord(recordId);
    } else {
      this.fetchStats();
      this.search();
    }
  }

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

  loadSingleRecord(id: string) {
    this.isLoading.set(true);
    this.api.get<any>(`data-portal/record/${id}`).subscribe({
      next: (record) => {
        this.singleRecord.set(record);
        this.showSingleView.set(true);
        this.isLoading.set(false);
        // Update SEO for individual record
        this.title.setTitle(`${record.companyName} — ${record.projectType} | Phoenix Data Intelligence`);
        this.meta.updateTag({ name: 'description', content: record.executiveSummary || `AI-enriched record for ${record.companyName}` });
      },
      error: () => {
        this.isLoading.set(false);
        this.search(); // Fall back to search view
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

  openCheckout(tier: string) {
    // Redirect to the services page with the data tier pre-selected
    sessionStorage.setItem('checkout_tier', tier);
    this.router.navigate(['/services']);
  }

  closeUpgradeModal() {
    this.showUpgradeModal.set(false);
  }

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
