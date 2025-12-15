import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { CallLogService } from '../../services/call-log.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-call-tracker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './call-tracker.html',
  styleUrls: ['./call-tracker.css']
})
export class CallTrackerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private callLogService = inject(CallLogService);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  callForm: FormGroup;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  recentCalls$: Observable<any[]> | null = null;
  customerSearchTerm: string = '';
  showDropdown: boolean = false;
  selectedCustomer: Customer | null = null;
  isSubmitting = false;

  statuses = ['Demo Scheduled', 'Post Demo Followup', 'Info Sent', 'Follow up Needed', 'Not Right Person', 'Firm No', 'Lost'];

  constructor() {
    this.callForm = this.fb.group({
      customerId: ['', Validators.required],
      attemptNumber: [1, Validators.required],
      status: ['', Validators.required],
      comments: [''],
      isDemo: [false]
    });
  }

  ngOnInit() {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      this.recentCalls$ = this.callLogService.getCallsByUser(currentUser.id);
    }

    // Load customers for lookup
    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.customers = customers;
        this.filteredCustomers = customers;
      },
      error: (error) => {
        console.error('Error loading customers', error);
        this.toastService.error('Failed to load customers');
      }
    });
  }

  getCustomerName(customerId: string): string {
    const customer = this.customers.find(c => c.id === customerId);
    return customer ? customer.companyName : 'Unknown Customer';
  }

  onCustomerSearch(event: Event) {
    const term = (event.target as HTMLInputElement).value.toLowerCase();
    this.customerSearchTerm = term;
    this.showDropdown = term.length > 0;

    if (term) {
      this.filteredCustomers = this.customers.filter(c =>
        c.companyName.toLowerCase().includes(term) ||
        c.location.toLowerCase().includes(term) ||
        c.industry.toLowerCase().includes(term)
      );
    } else {
      this.filteredCustomers = this.customers;
    }
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomer = customer;
    this.customerSearchTerm = customer.companyName;
    this.callForm.patchValue({ customerId: customer.id });
    this.showDropdown = false;
  }

  onInputFocus() {
    if (this.customerSearchTerm) {
      this.showDropdown = true;
    }
  }

  onInputBlur() {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      this.showDropdown = false;
    }, 200);
  }

  async onSubmit() {
    if (this.callForm.invalid) {
      this.callForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    this.isSubmitting = true;
    const customerId = this.callForm.value.customerId;
    const attemptNumber = this.callForm.value.attemptNumber;
    const status = this.callForm.value.status;

    // Check for duplicate attempt
    this.callLogService.getCallsForCustomer(customerId).subscribe({
      next: (calls) => {
        const attemptExists = calls.some(c => c.attemptNumber === attemptNumber);
        if (attemptExists) {
          this.toastService.error(`Attempt #${attemptNumber} already exists for this customer`);
          this.isSubmitting = false;
          return;
        }

        // Validate "Post Demo Followup"
        if (status === 'Post Demo Followup') {
          // Check if customer is in 'Demo Scheduled' stage OR has a 'Demo Scheduled' call log
          const hasDemoScheduled = this.selectedCustomer?.stage === 'Demo Scheduled' ||
            calls.some(c => c.status === 'Demo Scheduled');

          if (!hasDemoScheduled) {
            this.toastService.error(`Cannot log "${status}": No demo has been scheduled for this customer.`);
            this.isSubmitting = false;
            return;
          }
        }

        // Proceed to save
        this.saveCallLog(currentUser);
      },
      error: (error) => {
        console.error('Error checking duplicate attempts', error);
        this.toastService.error('Failed to validate call attempt');
        this.isSubmitting = false;
      }
    });
  }

  private saveCallLog(currentUser: any) {
    const callData = {
      ...this.callForm.value,
      userId: currentUser.id,
      date: new Date().toISOString()
    };

    const customerId = this.callForm.value.customerId;
    const callStatus = this.callForm.value.status;

    // Map call status to customer stage
    type CustomerStage = 'In Progress' | 'Demo Scheduled' | 'Negotiation' | 'Closed Won' | 'Closed Lost' | 'Deferred';

    const stageMapping: { [key: string]: CustomerStage } = {
      'Demo Scheduled': 'Demo Scheduled',
      'Post Demo Followup': 'Negotiation',
      'Info Sent': 'In Progress',
      'Follow up Needed': 'In Progress',
      'Not Right Person': 'Deferred',
      'Firm No': 'Closed Lost',
      'Lost': 'Closed Lost'
    };

    const newStage: CustomerStage = stageMapping[callStatus] || 'In Progress';

    // Log the call
    this.callLogService.addCallLog(callData).subscribe({
      next: () => {
        this.toastService.success('Call logged successfully');

        // Update customer stage
        if (customerId && this.selectedCustomer) {
          const updateData = {
            ...this.selectedCustomer,
            stage: newStage
          };

          this.customerService.updateCustomer(customerId, updateData, currentUser.id).subscribe({
            next: () => {
              console.log('Customer stage updated to:', newStage);
            },
            error: (error) => {
              console.error('Error updating customer stage', error);
            }
          });
        }

        // Reset form
        this.callForm.reset({ attemptNumber: 1, isDemo: false });
        this.customerSearchTerm = '';
        this.selectedCustomer = null;
        this.showDropdown = false;
        this.isSubmitting = false;

        // Refresh recent calls
        if (currentUser) {
          this.recentCalls$ = this.callLogService.getCallsByUser(currentUser.id);
        }
      },
      error: (error) => {
        console.error('Error logging call', error);
        this.toastService.error('Failed to log call');
        this.isSubmitting = false;
      }
    });
  }
}
