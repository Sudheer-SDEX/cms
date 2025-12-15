import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallLogService, CallLog } from '../../services/call-log.service';
import { AuthService } from '../../services/auth.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { Observable, map, combineLatest, of } from 'rxjs';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-dashboard.html',
  styleUrls: ['./user-dashboard.css']
})
export class UserDashboardComponent implements OnInit {
  private callLogService = inject(CallLogService);
  private authService = inject(AuthService);
  private customerService = inject(CustomerService);

  totalCalls$: Observable<number> = of(0);
  demosScheduled$: Observable<number> = of(0);
  followUpsNeeded$: Observable<number> = of(0);
  activeLeads$: Observable<number> = of(0);
  conversionRate$: Observable<number> = of(0);
  industryStats$: Observable<{ name: string, total: number, demos: number }[]> = of([]);

  ngOnInit() {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const calls$ = this.callLogService.getCallsByUser(currentUser.id);

      this.totalCalls$ = calls$.pipe(map(calls => calls.length));
      this.demosScheduled$ = calls$.pipe(map(calls => calls.filter(c => c.status === 'Demo Scheduled').length));
      this.followUpsNeeded$ = calls$.pipe(map(calls => calls.filter(c => c.status === 'Follow up Needed' || c.status === 'Info Sent').length));

      const customers$ = this.customerService.getCustomers();

      // Calculate active leads (customers in progress or demo scheduled)
      this.activeLeads$ = customers$.pipe(
        map(customers => customers.filter(c =>
          c.stage === 'In Progress' || c.stage === 'Demo Scheduled' || c.stage === 'Negotiation'
        ).length)
      );

      // Calculate conversion rate (demos / total calls * 100)
      this.conversionRate$ = combineLatest([this.totalCalls$, this.demosScheduled$]).pipe(
        map(([total, demos]) => total > 0 ? Math.round((demos / total) * 100 * 10) / 10 : 0)
      );

      this.industryStats$ = combineLatest([calls$, customers$]).pipe(
        map(([calls, customers]: [CallLog[], Customer[]]) => {
          const stats: Record<string, { total: number, demos: number }> = {};

          calls.forEach(call => {
            const customer = customers.find(c => c.id === call.customerId);
            if (customer) {
              const industry = customer.industry || 'Unknown';
              if (!stats[industry]) stats[industry] = { total: 0, demos: 0 };
              stats[industry].total++;
              if (call.status === 'Demo Scheduled') stats[industry].demos++;
            }
          });

          return Object.entries(stats).map(([name, data]) => ({ name, ...data }));
        })
      );
    }
  }
}
