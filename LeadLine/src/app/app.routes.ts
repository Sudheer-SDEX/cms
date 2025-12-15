import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: '',
        canActivate: [authGuard],
        children: [
            { path: '', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent) },
            { path: 'customers', loadComponent: () => import('./components/customer-list/customer-list').then(m => m.CustomerListComponent) },
            { path: 'customers/new', loadComponent: () => import('./components/customer-form/customer-form').then(m => m.CustomerFormComponent) },
            { path: 'customers/:id', loadComponent: () => import('./components/customer-form/customer-form').then(m => m.CustomerFormComponent) },
            { path: 'calls', loadComponent: () => import('./components/call-tracker/call-tracker').then(m => m.CallTrackerComponent) }
        ]
    },
    { path: '**', redirectTo: '' }
];
