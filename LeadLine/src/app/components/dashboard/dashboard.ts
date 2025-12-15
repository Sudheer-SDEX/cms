import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../services/user.service';
import { UserDashboardComponent } from '../user-dashboard/user-dashboard';
import { AdminDashboardComponent } from '../admin-dashboard/admin-dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, UserDashboardComponent, AdminDashboardComponent],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent {
  userService = inject(UserService);
  userProfile$ = this.userService.userProfile$;
}
