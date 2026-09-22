import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, catchError, filter, map, of, startWith, switchMap, tap } from 'rxjs';

import { ChartComponent } from '../../components/chart/chart.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { ChartItem } from '../../models/chart-item.model';
import { Indicator } from '../../models/indicator.model';
import { Olympic } from '../../models/olympic.model';
import { DataService } from '../../services/data.service';

type CountryDetailView =
  | { state: 'loading' | 'empty' | 'error' }
  | { state: 'loaded'; title: string; indicators: Indicator[]; chartItems: ChartItem[] };

@Component({
  selector: 'app-country-detail-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink, HeaderComponent, ChartComponent, PageStatusComponent],
  templateUrl: './country-detail-page.component.html',
  styleUrl: './country-detail-page.component.scss'
})
export class CountryDetailPageComponent {
  readonly view$: Observable<CountryDetailView> = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    switchMap((id) => this.dataService.getOlympicById(id).pipe(
      // Unknown or invalid id: show the not-found page, keeping the typed URL
      tap((olympic) => {
        if (!olympic) {
          this.router.navigate(['/not-found'], { skipLocationChange: true });
        }
      }),
      filter((olympic): olympic is Olympic => olympic !== undefined),
      map((olympic) => this.toView(olympic)),
      startWith<CountryDetailView>({ state: 'loading' }),
      catchError(() => of<CountryDetailView>({ state: 'error' }))
    ))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dataService: DataService
  ) { }

  private toView(olympic: Olympic): CountryDetailView {
    if (olympic.participations.length === 0) {
      return { state: 'empty' };
    }
    return {
      state: 'loaded',
      title: olympic.country,
      indicators: [
        { label: 'Number of entries', value: olympic.participations.length },
        { label: 'Total Number of medals', value: this.dataService.countMedals(olympic) },
        { label: 'Total Number of athletes', value: this.dataService.countAthletes(olympic) }
      ],
      chartItems: olympic.participations.map((participation) => ({
        id: participation.id,
        label: String(participation.year),
        value: participation.medalsCount
      }))
    };
  }
}
