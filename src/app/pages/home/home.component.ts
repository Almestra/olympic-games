import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

import { HeaderComponent } from '../../components/header/header.component';
import { ChartComponent } from '../../components/chart/chart.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';
import { Indicator } from '../../models/indicator.model';
import { ChartItem } from '../../models/chart-item.model';
import { PageState } from '../../models/page-state.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [HeaderComponent, ChartComponent, PageStatusComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  public state: PageState = 'loading';
  private olympicUrl = './assets/mock/olympic.json';
  public chartItems: ChartItem[] = [];
  public totalCountries: number = 0
  public totalJOs: number = 0
  public error!:string
  titlePage: string = "Medals per Country";
  public indicators: Indicator[] = [];

  constructor(private router: Router, private http:HttpClient) { }

  ngOnInit() {
    this.http.get<any[]>(this.olympicUrl).pipe().subscribe(
      (data) => {
        console.log(`Liste des données : ${JSON.stringify(data)}`);
        if (data && data.length > 0) {
          this.totalJOs = Array.from(new Set(data.map((i: any) => i.participations.map((f: any) => f.year)).flat())).length;
          const countries: string[] = data.map((i: any) => i.country);
          this.totalCountries = countries.length;
          this.indicators = [
            { label: 'Number of countries', value: this.totalCountries },
            { label: 'Number of JOs', value: this.totalJOs },
          ];
          const medals = data.map((i: any) => i.participations.map((i: any) => (i.medalsCount)));
          const sumOfAllMedalsYears = medals.map((i) => i.reduce((acc: any, i: any) => acc + i, 0));
          this.chartItems = data.map((olympic, index) => ({
            id: olympic.id,
            label: olympic.country,
            value: sumOfAllMedalsYears[index],
          }));
          this.state = 'loaded';
        } else {
          this.state = 'empty';
        }
      },
      (error:HttpErrorResponse) => {
        console.log(`erreur : ${error}`);
        this.error = error.message
        this.state = 'error';
      }
    )
  }

  openCountry(id: number): void {
    this.router.navigate(['country', id]);
  }
}

