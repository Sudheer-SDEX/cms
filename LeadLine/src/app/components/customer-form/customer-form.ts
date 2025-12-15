import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CustomerService, Customer } from '../../services/customer.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './customer-form.html',
  styleUrls: ['./customer-form.css']
})
export class CustomerFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private customerService = inject(CustomerService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  customerForm: FormGroup;
  isEditMode = false;
  customerId: string | null = null;
  isSubmitting = false;

  industries = ['Automobile', 'Healthcare', 'Manufacturing', 'Logistics', 'Education'];

  constructor() {
    this.customerForm = this.fb.group({
      companyName: ['', Validators.required],
      location: ['', Validators.required],
      industry: ['', Validators.required],
      website: [''],
      customerPotential: [''],
      stage: ['In Progress'],
      additionalNotes: [''],
      contacts: this.fb.array([this.createContactFormGroup()])
    });
  }

  get contacts(): FormArray {
    return this.customerForm.get('contacts') as FormArray;
  }

  createContactFormGroup(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      designation: [''],
      mobile: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  addContact() {
    this.contacts.push(this.createContactFormGroup());
  }

  removeContact(index: number) {
    if (this.contacts.length > 1) {
      this.contacts.removeAt(index);
    }
  }

  ngOnInit() {
    this.customerId = this.route.snapshot.paramMap.get('id');
    if (this.customerId) {
      this.isEditMode = true;
      this.customerService.getCustomer(this.customerId).subscribe({
        next: (customer) => {
          // Clear default contact
          this.contacts.clear();

          // Add contacts from customer data
          if (customer.contactPerson1) {
            this.contacts.push(this.fb.group(customer.contactPerson1));
          }
          if (customer.contactPerson2 && customer.contactPerson2.name) {
            this.contacts.push(this.fb.group(customer.contactPerson2));
          }
          if (customer.contactPerson3 && customer.contactPerson3.name) {
            this.contacts.push(this.fb.group(customer.contactPerson3));
          }

          // Patch other fields
          this.customerForm.patchValue({
            companyName: customer.companyName,
            location: customer.location,
            industry: customer.industry,
            website: customer.website,
            customerPotential: customer.customerPotential,
            stage: customer.stage || 'In Progress',
            additionalNotes: customer.additionalNotes || ''
          });
        },
        error: (error) => {
          console.error('Error loading customer', error);
          this.toastService.error('Failed to load customer details');
        }
      });
    }
  }

  async onSubmit() {
    if (this.customerForm.invalid) {
      this.customerForm.markAllAsTouched();
      return;
    }

    const currentUser = this.authService.currentUser;
    if (!currentUser) return;

    this.isSubmitting = true;
    const formValue = this.customerForm.value;

    // Check for duplicates
    const primaryEmail = formValue.contacts[0]?.email;

    this.customerService.checkDuplicate(
      formValue.companyName,
      primaryEmail,
      this.customerId || undefined
    ).subscribe({
      next: (result) => {
        if (result.isDuplicate) {
          this.toastService.error(result.message || 'Duplicate customer found');
          this.isSubmitting = false;
          return;
        }

        // Proceed with save if no duplicate
        this.saveCustomer(formValue, currentUser.id);
      },
      error: (error) => {
        console.error('Error checking duplicates', error);
        this.toastService.error('Failed to validate customer data');
        this.isSubmitting = false;
      }
    });
  }

  private saveCustomer(formValue: any, userId: string) {
    // Convert contacts array to contactPerson1, contactPerson2, contactPerson3
    const customerData: any = {
      companyName: formValue.companyName,
      location: formValue.location,
      industry: formValue.industry,
      website: formValue.website,
      customerPotential: formValue.customerPotential,
      stage: formValue.stage,
      additionalNotes: formValue.additionalNotes,
      contactPerson1: formValue.contacts[0] || {},
      contactPerson2: formValue.contacts[1] || { name: '', designation: '', mobile: '', email: '' },
      contactPerson3: formValue.contacts[2] || { name: '', designation: '', mobile: '', email: '' }
    };

    if (this.isEditMode && this.customerId) {
      this.customerService.updateCustomer(this.customerId, customerData, userId).subscribe({
        next: () => {
          this.toastService.success('Customer updated successfully');
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error updating customer', error);
          this.toastService.error('Failed to update customer');
          this.isSubmitting = false;
        }
      });
    } else {
      this.customerService.addCustomer(customerData, userId).subscribe({
        next: () => {
          this.toastService.success('Customer created successfully');
          this.router.navigate(['/customers']);
        },
        error: (error) => {
          console.error('Error creating customer', error);
          this.toastService.error('Failed to create customer');
          this.isSubmitting = false;
        }
      });
    }
  }
}
