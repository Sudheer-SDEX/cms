import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.html',
    styleUrls: ['./sidebar.css']
})
export class SidebarComponent {
    authService = inject(AuthService);
    userService = inject(UserService);
    router = inject(Router);

    userProfile$ = this.userService.userProfile$;

    logout() {
        this.authService.logout();
    }
}
