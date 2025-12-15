import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, User } from './auth.service';

export interface UserProfile {
    id: string;
    email: string;
    displayName: string;
    role: 'admin' | 'user';
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private http = inject(HttpClient);
    private authService = inject(AuthService);

    get userProfile$(): Observable<UserProfile | null> {
        // Return current user from AuthService
        return this.authService.currentUser$ as Observable<UserProfile | null>;
    }

    getUserProfile(): Observable<UserProfile> {
        return this.http.get<UserProfile>(`${environment.apiUrl}/users/me`);
    }

    getAllUsers(): Observable<UserProfile[]> {
        return this.http.get<UserProfile[]>(`${environment.apiUrl}/users`);
    }
}
