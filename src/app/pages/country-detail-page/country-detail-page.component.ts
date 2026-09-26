import { Component, computed, effect } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { ChartComponent } from '../../components/chart/chart.component';
import { HeaderComponent } from '../../components/header/header.component';
import { PageSkeletonComponent } from '../../components/page-skeleton/page-skeleton.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { ChartItem } from '../../models/chart-item.model';
import { Indicator } from '../../models/indicator.model';
import { Olympic } from '../../models/olympic.model';
import { State } from '../../models/state.model';
import { DataService } from '../../services/data.service';

type CountryDetailView = State<{ title: string; indicators: Indicator[]; chartItems: ChartItem[] }>;

@Component({
  selector: 'app-country-detail-page',
  standalone: true,
  imports: [RouterLink, HeaderComponent, ChartComponent, PageSkeletonComponent, PageStatusComponent],
  templateUrl: './country-detail-page.component.html',
  styleUrl: './country-detail-page.component.scss'
})
export class CountryDetailPageComponent {
  // The id from the URL, as a signal that follows URL changes
  private readonly id = toSignal(
    this.route.paramMap.pipe(map((params) => Number(params.get('id')))),
    { requireSync: true }
  );
  private readonly olympic = this.dataService.getOlympicById(this.id);
  // undefined means an unknown or invalid id (handled by the effect below)
  readonly view = computed<CountryDetailView | undefined>(() => {
    const result = this.olympic();
    if (result.state !== 'loaded') {
      return { state: result.state };
    }
    if (!result.olympic) {
      return undefined;
    }
    return this.toView(result.olympic);
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly dataService: DataService
  ) {
    // Unknown or invalid id: show the not-found page, keeping the typed URL
    effect(() => {
      if (!this.view()) {
        this.router.navigate(['/not-found'], { skipLocationChange: true });
      }
    });
  }

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
