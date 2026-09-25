import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, filter, map, switchMap, tap } from 'rxjs';

import { ChartComponent } from '../../components/chart/chart.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageSkeletonComponent } from '../../components/page-skeleton/page-skeleton.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { ChartItem } from '../../models/chart-item.model';
import { Indicator } from '../../models/indicator.model';
import { Olympic } from '../../models/olympic.model';
import { PageState } from '../../models/page-state.model';
import { DataService } from '../../services/data.service';

type CountryDetailView =
  | { state: Exclude<PageState, 'loaded'> }
  | { state: 'loaded'; title: string; indicators: Indicator[]; chartItems: ChartItem[] };

@Component({
  selector: 'app-country-detail-page',
  standalone: true,
  imports: [AsyncPipe, RouterLink, HeaderComponent, ChartComponent, PageSkeletonComponent, PageStatusComponent],
  templateUrl: './country-detail-page.component.html',
  styleUrl: './country-detail-page.component.scss'
})
export class CountryDetailPageComponent {
  readonly view$: Observable<CountryDetailView> = this.route.paramMap.pipe(
    map((params) => Number(params.get('id'))),
    switchMap((id) => this.dataService.getOlympicById(id).pipe(
      map((olympic): CountryDetailView | undefined => {
        if (olympic.status !== 'loaded') {
          return { state: olympic.status };
        }
        if (!olympic.data) {
          return undefined;
        }
        return this.toView(olympic.data);
      }),
      // Unknown or invalid id: show the not-found page, keeping the typed URL
      tap((view) => {
        if (!view) {
          this.router.navigate(['/not-found'], { skipLocationChange: true });
        }
      }),
      filter((view): view is CountryDetailView => view !== undefined)
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
