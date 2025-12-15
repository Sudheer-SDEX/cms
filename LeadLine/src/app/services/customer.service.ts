import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ContactPerson {
    name: string;
    designation: string;
    mobile: string;
    email: string;
}

export interface Customer {
    id?: string;
    companyName: string;
    contactPerson1: ContactPerson;
    contactPerson2?: ContactPerson;
    contactPerson3?: ContactPerson;
    location: string;
    industry: 'Automobile' | 'Healthcare' | 'Manufacturing' | 'Logistics' | 'Education';
    website: string;
    customerPotential?: string;
    stage?: 'In Progress' | 'Demo Scheduled' | 'Negotiation' | 'Closed Won' | 'Closed Lost' | 'Deferred';
    additionalNotes?: string;
    comments: { userId: string, timestamp: string, text: string }[];
    auditLog: { action: 'create' | 'update', userId: string, timestamp: string, details: string }[];
}

@Injectable({
    providedIn: 'root'
})
export class CustomerService {
    private http = inject(HttpClient);

    getCustomers(): Observable<Customer[]> {
        return this.http.get<Customer[]>(`${environment.apiUrl}/customers`);
    }

    getCustomer(id: string): Observable<Customer> {
        return this.http.get<Customer>(`${environment.apiUrl}/customers/${id}`);
    }

    addCustomer(customer: Omit<Customer, 'id' | 'auditLog'>, userId: string): Observable<Customer> {
        const newCustomer = {
            ...customer,
            auditLog: [{
                action: 'create' as const,
                userId,
                timestamp: new Date().toISOString(),
                details: 'Customer created'
            }]
        };
        return this.http.post<Customer>(`${environment.apiUrl}/customers`, newCustomer);
    }

    updateCustomer(id: string, data: Partial<Customer>, userId: string): Observable<Customer> {
        const updateData = {
            ...data,
            auditLog: [
                ...(data.auditLog || []),
                {
                    action: 'update' as const,
                    userId,
                    timestamp: new Date().toISOString(),
                    details: 'Customer updated'
                }
            ]
        };
        return this.http.put<Customer>(`${environment.apiUrl}/customers/${id}`, updateData);
    }

    checkDuplicate(companyName: string, email: string, excludeId?: string): Observable<{ isDuplicate: boolean, message?: string }> {
        return this.getCustomers().pipe(
            map(customers => {
                const nameExists = customers.some(c =>
                    c.companyName.toLowerCase() === companyName.toLowerCase() && c.id !== excludeId
                );
                if (nameExists) return { isDuplicate: true, message: 'Company name already exists' };

                if (email) {
                    const emailExists = customers.some(c =>
                        (c.id !== excludeId) && (
                            c.contactPerson1.email.toLowerCase() === email.toLowerCase() ||
                            c.contactPerson2?.email?.toLowerCase() === email.toLowerCase() ||
                            c.contactPerson3?.email?.toLowerCase() === email.toLowerCase()
                        )
                    );
                    if (emailExists) return { isDuplicate: true, message: 'Email address already exists' };
                }

                return { isDuplicate: false };
            })
        );
    }
}
