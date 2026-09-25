import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoadState } from '../models/load-state.model';
import { Olympic } from '../models/olympic.model';
import { Period } from '../models/period.model';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Holds the current state and gives it at once to every new subscriber
  private readonly state$ = new BehaviorSubject<LoadState<Olympic[]>>({ status: 'loading' });

  constructor(private readonly http: HttpClient) {
    this.load();
  }

  getOlympics(): Observable<LoadState<Olympic[]>> {
    // Retry if the previous download failed
    if (this.state$.value.status === 'error') {
      this.load();
    }
    // Read-only access: components cannot call next()
    return this.state$.asObservable();
  }

  getOlympicById(id: number): Observable<LoadState<Olympic | undefined>> {
    return this.getOlympics().pipe(
      map((state) => {
        // Loading or failed: nothing to search yet
        if (state.status !== 'loaded') {
          return state;
        }
        // Keep only the matching country (undefined if the id is unknown)
        return { status: 'loaded', data: state.data.find((olympic) => olympic.id === id) };
      }),
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

  getPeriod(olympics: Olympic[]): Period | undefined {
    const years = this.getYears(olympics);
    if (years.length === 0) {
      return undefined;
    }
    return { start: Math.min(...years), end: Math.max(...years) };
  }

  private getYears(olympics: Olympic[]): number[] {
    return olympics.flatMap((olympic) => olympic.participations.map((participation) => participation.year));
  }

  private load(): void {
    this.state$.next({ status: 'loading' });
    this.http
      .get<Olympic[]>(environment.dataUrl)
      .pipe(
        map((olympics) => [...olympics].sort((a, b) => this.countMedals(b) - this.countMedals(a))),
      )
      .subscribe({
        next: (olympics) => this.state$.next({ status: 'loaded', data: olympics }),
        // Never call state$.error(): a subject that received an error stays dead
        error: () => this.state$.next({ status: 'error' }),
      });
  }
}
