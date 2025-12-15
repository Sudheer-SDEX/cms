import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'user';
}

export interface LoginResponse {
    user: User;
    token: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);

    private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() { }

    private getUserFromStorage(): User | null {
        const userStr = localStorage.getItem('current_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    login(email: string, password: string): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                tap(response => {
                    // Store token and user
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('current_user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                })
            );
    }

    logout(): void {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        localStorage.removeItem('mockUser'); // Clean up old test login
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    get currentUser(): User | null {
        return this.currentUserSubject.value;
    }

    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    }
}
