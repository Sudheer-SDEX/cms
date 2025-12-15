import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './components/sidebar/sidebar';
import { ToastComponent } from './components/toast/toast';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, SidebarComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  title = 'LeadLine';
  private router = inject(Router);
  isLoginPage = false;

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // Check if the current URL is login
      // Also handle URLs with query parameters
      const url = event.urlAfterRedirects || event.url;
      this.isLoginPage = url.startsWith('/login');
    });
  }
}
