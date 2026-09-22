import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, startWith } from 'rxjs';

import { ChartComponent } from '../../components/chart/chart.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { ChartItem } from '../../models/chart-item.model';
import { Indicator } from '../../models/indicator.model';
import { Olympic } from '../../models/olympic.model';
import { DataService } from '../../services/data.service';

type DashboardView =
  | { state: 'loading' | 'empty' | 'error' }
  | { state: 'loaded'; indicators: Indicator[]; chartItems: ChartItem[] };

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [AsyncPipe, HeaderComponent, ChartComponent, PageStatusComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss'
})
export class DashboardPageComponent {
  readonly title = 'Medals per Country';
  readonly view$: Observable<DashboardView> = this.dataService.getOlympics().pipe(
    map((olympics) => this.toView(olympics)),
    startWith<DashboardView>({ state: 'loading' }),
    catchError(() => of<DashboardView>({ state: 'error' }))
  );

  constructor(
    private readonly router: Router,
    private readonly dataService: DataService
  ) { }

  openCountry(id: number): void {
    this.router.navigate(['country', id]);
  }

  private toView(olympics: Olympic[]): DashboardView {
    if (olympics.length === 0) {
      return { state: 'empty' };
    }
    return {
      state: 'loaded',
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
