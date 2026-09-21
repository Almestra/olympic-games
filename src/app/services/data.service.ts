import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';

import { environment } from '../../environments/environment';
import { Olympic } from '../models/olympic.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly olympics$: Observable<Olympic[]> = this.http
    .get<Olympic[]>(environment.dataUrl)
    .pipe(
      map((olympics) => [...olympics].sort((a, b) => this.countMedals(b) - this.countMedals(a))),
      shareReplay(1),
    );

  constructor(private readonly http: HttpClient) { }

  getOlympics(): Observable<Olympic[]> {
    return this.olympics$;
  }

  getOlympicById(id: number): Observable<Olympic | undefined> {
    return this.olympics$.pipe(
      map((olympics) => olympics.find((olympic) => olympic.id === id)),
    );
  }

  countMedals(olympic: Olympic): number {
    return olympic.participations.reduce((total, participation) => total + participation.medalsCount, 0);
  }

  countAthletes(olympic: Olympic): number {
    return olympic.participations.reduce((total, participation) => total + participation.athleteCount, 0);
  }

  countGames(olympics: Olympic[]): number {
    return new Set(this.getYears(olympics)).size;
  }

  getPeriod(olympics: Olympic[]): { start: number; end: number } | undefined {
    const years = this.getYears(olympics);
    if (years.length === 0) {
      return undefined;
    }
    return { start: Math.min(...years), end: Math.max(...years) };
  }

  private getYears(olympics: Olympic[]): number[] {
    return olympics.flatMap((olympic) => olympic.participations.map((participation) => participation.year));
  }
}
