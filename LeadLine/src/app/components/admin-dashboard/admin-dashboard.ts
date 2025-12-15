import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CallLogService, CallLog } from '../../services/call-log.service';
import { CustomerService, Customer } from '../../services/customer.service';
import { UserService } from '../../services/user.service';
import { Observable, map, combineLatest, of } from 'rxjs';

interface IndustryMetrics {
  name: string;
  totalCalls: number;
  demos: number;
  conversionRate: number;
  activeLeads: number;
}

interface StageMetrics {
  stage: string;
  count: number;
  percentage: number;
}

interface UserPerformance {
  userName: string;
  totalCalls: number;
  demos: number;
  conversionRate: number;
}

interface CustomerGrowth {
  period: string;
  count: number;
  cumulative: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private callLogService = inject(CallLogService);
  private customerService = inject(CustomerService);
  private userService = inject(UserService);

  // Overall Metrics
  totalCustomers$: Observable<number> = of(0);
  totalCalls$: Observable<number> = of(0);
  totalDemos$: Observable<number> = of(0);
  overallConversionRate$: Observable<number> = of(0);
  activeLeads$: Observable<number> = of(0);
  closedWon$: Observable<number> = of(0);

  // Detailed Metrics
  industryMetrics$: Observable<IndustryMetrics[]> = of([]);
  stageDistribution$: Observable<StageMetrics[]> = of([]);
  userPerformance$: Observable<UserPerformance[]> = of([]);
  customerGrowth$: Observable<CustomerGrowth[]> = of([]);
  maxCumulative: number = 1;

  // Growth chart controls
  growthViewType: 'week' | 'month' = 'week';
  growthTimeRange: 'last30' | 'last90' | 'all' = 'last90';
  filteredGrowth: CustomerGrowth[] = [];

  ngOnInit() {
    const customers$ = this.customerService.getCustomers();
    const allCalls$ = this.callLogService.getCallsByUser(''); // Get all calls
    const users$ = this.userService.getAllUsers();

    // Overall metrics
    this.totalCustomers$ = customers$.pipe(map(customers => customers.length));

    this.totalCalls$ = allCalls$.pipe(map(calls => calls.length));

    this.totalDemos$ = allCalls$.pipe(
      map(calls => calls.filter(c => c.status === 'Demo Scheduled').length)
    );

    this.overallConversionRate$ = combineLatest([this.totalCalls$, this.totalDemos$]).pipe(
      map(([total, demos]) => total > 0 ? Math.round((demos / total) * 100 * 10) / 10 : 0)
    );

    this.activeLeads$ = customers$.pipe(
      map(customers => customers.filter(c =>
        c.stage === 'In Progress' || c.stage === 'Demo Scheduled' || c.stage === 'Negotiation'
      ).length)
    );

    this.closedWon$ = customers$.pipe(
      map(customers => customers.filter(c => c.stage === 'Closed Won').length)
    );

    // Industry metrics
    this.industryMetrics$ = combineLatest([allCalls$, customers$]).pipe(
      map(([calls, customers]) => {
        const metrics: Record<string, IndustryMetrics> = {};

        // Initialize with all industries
        customers.forEach(customer => {
          const industry = customer.industry || 'Unknown';
          if (!metrics[industry]) {
            metrics[industry] = {
              name: industry,
              totalCalls: 0,
              demos: 0,
              conversionRate: 0,
              activeLeads: 0
            };
          }

          if (customer.stage === 'In Progress' || customer.stage === 'Demo Scheduled' || customer.stage === 'Negotiation') {
            metrics[industry].activeLeads++;
          }
        });

        // Add call data
        calls.forEach(call => {
          const customer = customers.find(c => c.id === call.customerId);
          if (customer) {
            const industry = customer.industry || 'Unknown';
            metrics[industry].totalCalls++;
            if (call.status === 'Demo Scheduled') {
              metrics[industry].demos++;
            }
          }
        });

        // Calculate conversion rates
        Object.values(metrics).forEach(metric => {
          metric.conversionRate = metric.totalCalls > 0
            ? Math.round((metric.demos / metric.totalCalls) * 100 * 10) / 10
            : 0;
        });

        return Object.values(metrics).sort((a, b) => b.totalCalls - a.totalCalls);
      })
    );

    // Stage distribution
    this.stageDistribution$ = customers$.pipe(
      map(customers => {
        const total = customers.length;
        const stages: Record<string, number> = {};

        customers.forEach(customer => {
          const stage = customer.stage || 'In Progress';
          stages[stage] = (stages[stage] || 0) + 1;
        });

        return Object.entries(stages)
          .map(([stage, count]) => ({
            stage,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
          }))
          .sort((a, b) => b.count - a.count);
      })
    );

    // User performance
    this.userPerformance$ = combineLatest([allCalls$, users$]).pipe(
      map(([calls, users]) => {
        const performance: Record<string, UserPerformance> = {};

        users.forEach(user => {
          performance[user.id] = {
            userName: user.displayName,
            totalCalls: 0,
            demos: 0,
            conversionRate: 0
          };
        });

        calls.forEach(call => {
          if (performance[call.userId]) {
            performance[call.userId].totalCalls++;
            if (call.status === 'Demo Scheduled') {
              performance[call.userId].demos++;
            }
          }
        });

        Object.values(performance).forEach(perf => {
          perf.conversionRate = perf.totalCalls > 0
            ? Math.round((perf.demos / perf.totalCalls) * 100 * 10) / 10
            : 0;
        });

        return Object.values(performance)
          .filter(p => p.totalCalls > 0)
          .sort((a, b) => b.totalCalls - a.totalCalls);
      })
    );

    // Customer growth over time (week by week)
    this.customerGrowth$ = customers$.pipe(
      map(customers => {
        const weeklyData: Record<string, number> = {};

        customers.forEach(customer => {
          const createLog = customer.auditLog?.find(log => log.action === 'create');
          if (createLog) {
            const date = new Date(createLog.timestamp);

            if (this.growthViewType === 'week') {
              // Get week start (Monday)
              const dayOfWeek = date.getDay();
              const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
              const weekStart = new Date(date.setDate(diff));
              weekStart.setHours(0, 0, 0, 0);

              const weekKey = weekStart.toISOString().split('T')[0];
              weeklyData[weekKey] = (weeklyData[weekKey] || 0) + 1;
            } else {
              // Monthly grouping
              const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
              weeklyData[monthKey] = (weeklyData[monthKey] || 0) + 1;
            }
          }
        });

        const sortedKeys = Object.keys(weeklyData).sort();
        let cumulative = 0;

        const allData = sortedKeys.map(key => {
          cumulative += weeklyData[key];
          let period: string;

          if (this.growthViewType === 'week') {
            const date = new Date(key);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            period = `${monthNames[date.getMonth()]} ${date.getDate()}`;
          } else {
            const [year, monthNum] = key.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            period = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
          }

          return {
            period,
            count: weeklyData[key],
            cumulative,
            dateKey: key
          };
        });

        // Apply time range filter
        const now = new Date();
        let filteredData = allData;

        if (this.growthTimeRange === 'last30') {
          const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filteredData = allData.filter(d => new Date(d.dateKey) >= cutoff);
        } else if (this.growthTimeRange === 'last90') {
          const cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          filteredData = allData.filter(d => new Date(d.dateKey) >= cutoff);
        }

        this.maxCumulative = cumulative > 0 ? cumulative : 1;
        this.filteredGrowth = filteredData;

        return filteredData;
      })
    );
  }

  onGrowthViewChange(viewType: 'week' | 'month') {
    this.growthViewType = viewType;
    // Trigger recalculation
    this.ngOnInit();
  }

  onTimeRangeChange(range: 'last30' | 'last90' | 'all') {
    this.growthTimeRange = range;
    // Trigger recalculation
    this.ngOnInit();
  }

  getGrowthBarWidth(cumulative: number): number {
    return (cumulative / this.maxCumulative) * 100;
  }

  getChartHeight(cumulative: number): number {
    return (cumulative / this.maxCumulative) * 100;
  }

  getNewCustomersCount(): number {
    return this.filteredGrowth.reduce((sum, d) => sum + d.count, 0);
  }

  getAveragePerPeriod(): number {
    const total = this.getNewCustomersCount();
    return this.filteredGrowth.length > 0 ? total / this.filteredGrowth.length : 0;
  }
}
