import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';
import { CallLogService } from '../../services/call-log.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './customer-list.html',
  styleUrls: ['./customer-list.css']
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private callLogService = inject(CallLogService);

  customers$: Observable<Customer[]> | null = null;
  filteredCustomers$: Observable<Customer[]> | null = null;
  searchTerm: string = '';
  selectedCustomer: Customer | null = null;
  showDetailModal: boolean = false;
  activeTab: 'profile' | 'audit' = 'profile';
  totalAttempts: number = 0;
  Math = Math; // For template access

  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalCustomers: number = 0;
  paginatedCustomers: Customer[] = [];

  ngOnInit() {
    this.customers$ = this.customerService.getCustomers();
    this.filteredCustomers$ = this.customers$;

    // Subscribe to get paginated data
    this.filteredCustomers$.subscribe(customers => {
      this.totalCustomers = customers.length;
      this.updatePaginatedCustomers(customers);
    });
  }

  updatePaginatedCustomers(customers: Customer[]) {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCustomers = customers.slice(startIndex, endIndex);
  }

  onSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = term;
    this.currentPage = 1; // Reset to first page on search

    if (this.customers$) {
      this.filteredCustomers$ = this.customers$.pipe(
        map(customers => customers.filter(c =>
          c.companyName.toLowerCase().includes(term) ||
          c.location.toLowerCase().includes(term) ||
          c.industry.toLowerCase().includes(term)
        ))
      );

      this.filteredCustomers$.subscribe(customers => {
        this.totalCustomers = customers.length;
        this.updatePaginatedCustomers(customers);
      });
    }
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.totalCustomers / this.pageSize);
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.filteredCustomers$?.subscribe(customers => {
        this.updatePaginatedCustomers(customers);
      });
    }
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  previousPage() {
    this.goToPage(this.currentPage - 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, this.currentPage - 2);
    let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }

  getInitials(companyName: string): string {
    return companyName.charAt(0).toUpperCase();
  }

  getStageClass(stage?: string): string {
    switch (stage) {
      case 'In Progress': return 'stage-progress';
      case 'Demo Scheduled': return 'stage-demo';
      case 'Negotiation': return 'stage-negotiation';
      case 'Closed Won': return 'stage-won';
      case 'Closed Lost': return 'stage-lost';
      case 'Deferred': return 'stage-deferred';
      default: return 'stage-progress';
    }
  }

  viewDetails(customer: Customer) {
    this.selectedCustomer = customer;
    this.showDetailModal = true;
    this.activeTab = 'profile';

    // Get total attempts for this customer
    if (customer.id) {
      this.callLogService.getCallsForCustomer(customer.id).subscribe(calls => {
        this.totalAttempts = calls.length;
      });
    }
  }

  closeModal() {
    this.showDetailModal = false;
    this.selectedCustomer = null;
  }

  setActiveTab(tab: 'profile' | 'audit') {
    this.activeTab = tab;
  }
}
