import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map } from 'rxjs';

import { ChartComponent } from '../../components/chart/chart.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageSkeletonComponent } from '../../components/page-skeleton/page-skeleton.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { ChartItem } from '../../models/chart-item.model';
import { Indicator } from '../../models/indicator.model';
import { Olympic } from '../../models/olympic.model';
import { PageState } from '../../models/page-state.model';
import { Period } from '../../models/period.model';
import { DataService } from '../../services/data.service';

type DashboardView =
  | { state: Exclude<PageState, 'loaded'> }
  | { state: 'loaded'; period: Period; indicators: Indicator[]; chartItems: ChartItem[] };

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, HeaderComponent, ChartComponent, PageSkeletonComponent, PageStatusComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  readonly title = 'Medals per Country';
  readonly view$: Observable<DashboardView> = this.dataService.getOlympics().pipe(
    map((olympics): DashboardView => {
      if (olympics.status !== 'loaded') {
        return { state: olympics.status };
      }
      return this.toView(olympics.data);
    })
  );

  constructor(
    private readonly router: Router,
    private readonly dataService: DataService
  ) { }

  openCountry(id: number): void {
    this.router.navigate(['country', id]);
  }

  private toView(olympics: Olympic[]): DashboardView {
    const period = this.dataService.getPeriod(olympics);
    if (!period) {
      return { state: 'empty' };
    }
    return {
      state: 'loaded',
      period,
      indicators: [
        { label: 'Number of countries', value: olympics.length },
        { label: 'Number of JOs', value: this.dataService.countGames(olympics) }
      ],
      chartItems: olympics.map((olympic) => ({
        id: olympic.id,
        label: olympic.country,
        value: this.dataService.countMedals(olympic)
      }))
    };
  }
}
