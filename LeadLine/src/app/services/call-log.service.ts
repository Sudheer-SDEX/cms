import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CallLog {
    id?: string;
    customerId: string;
    userId: string;
    date: string;
    attemptNumber: number;
    status: 'Demo Scheduled' | 'Info Sent' | 'Follow up Needed' | 'Not Right Person' | 'Firm No' | 'Lost';
    comments: string;
    isDemo: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class CallLogService {
    private http = inject(HttpClient);

    addCallLog(call: Omit<CallLog, 'id'>): Observable<CallLog> {
        return this.http.post<CallLog>(`${environment.apiUrl}/callLogs`, call);
    }

    getCallsForCustomer(customerId: string): Observable<CallLog[]> {
        return this.http.get<CallLog[]>(`${environment.apiUrl}/callLogs/customer/${customerId}`);
    }

    getCallsByUser(userId: string): Observable<CallLog[]> {
        return this.http.get<CallLog[]>(`${environment.apiUrl}/callLogs/user/${userId}`);
    }

    getAllCalls(): Observable<CallLog[]> {
        return this.http.get<CallLog[]>(`${environment.apiUrl}/callLogs`);
    }
}
