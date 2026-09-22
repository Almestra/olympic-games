import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, ParamMap, Router, RouterLink} from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { ChartComponent } from '../../components/chart/chart.component';
import { Indicator } from '../../models/indicator.model';
import { ChartItem } from '../../models/chart-item.model';
import { Participation } from '../../models/participation.model';

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [RouterLink, HeaderComponent, ChartComponent],
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit {
  private olympicUrl = './assets/mock/olympic.json';
  public chartItems: ChartItem[] = [];
  public titlePage: string = '';
  public totalEntries: any = 0;
  public totalMedals: number = 0;
  public totalAthletes: number = 0;
  public error!: string;
  public indicators: Indicator[] = [];

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {
  }

  ngOnInit() {
    let countryId: number | null = null
    this.route.paramMap.subscribe((param: ParamMap) => countryId = Number(param.get('id')));
    this.http.get<any[]>(this.olympicUrl).pipe().subscribe(
      (data) => {
        if (data && data.length > 0) {
          const selectedCountry = data.find((i: any) => i.id === countryId);
          this.titlePage = selectedCountry.country;
          const participations: Participation[] = selectedCountry?.participations ?? [];
          this.totalEntries = participations?.length ?? 0;
          const medals = selectedCountry?.participations.map((i: any) => i.medalsCount.toString()) ?? [];
          this.totalMedals = medals.reduce((accumulator: any, item: any) => accumulator + parseInt(item), 0);
          const nbAthletes = selectedCountry?.participations.map((i: any) => i.athleteCount.toString()) ?? []
          this.totalAthletes = nbAthletes.reduce((accumulator: any, item: any) => accumulator + parseInt(item), 0);
          this.indicators = [
            { label: 'Number of entries', value: this.totalEntries },
            { label: 'Total Number of medals', value: this.totalMedals },
            { label: 'Total Number of athletes', value: this.totalAthletes },
          ];
          this.chartItems = participations.map((participation) => ({
            id: participation.id,
            label: String(participation.year),
            value: participation.medalsCount,
          }));
        }
      },
      (error: HttpErrorResponse) => {
        this.error = error.message
      }
    );
  }
}
