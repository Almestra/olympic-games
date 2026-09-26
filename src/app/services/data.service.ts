import { HttpClient } from '@angular/common/http';
import { Injectable, Signal, computed, signal } from '@angular/core';
import { map } from 'rxjs';

import { environment } from '../../environments/environment';
import { Olympic } from '../models/olympic.model';
import { Period } from '../models/period.model';
import { State } from '../models/state.model';

// The service never decides that the data is empty: each page does
type DataState<T> = Exclude<State<T>, { state: 'empty' }>;

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Holds the current state; the templates and computed() that read it update on change
  private readonly olympics = signal<DataState<{ olympics: Olympic[] }>>({ state: 'loading' });

  constructor(private readonly http: HttpClient) {
    this.load();
  }

  // Call it outside computed() and templates: it may start a download
  getOlympics(): Signal<DataState<{ olympics: Olympic[] }>> {
    // Retry if the previous download failed
    if (this.olympics().state === 'error') {
      this.load();
    }
    // Read-only access: components cannot call set()
    return this.olympics.asReadonly();
  }

  getOlympicById(id: Signal<number>): Signal<DataState<{ olympic: Olympic | undefined }>> {
    // Called here, not inside computed(): it may start a download
    const olympics = this.getOlympics();
    return computed(() => {
      const result = olympics();
      // Loading or failed: nothing to search yet
      if (result.state !== 'loaded') {
        return result;
      }
      // Keep only the matching country (undefined if the id is unknown)
      return { state: 'loaded', olympic: result.olympics.find((olympic) => olympic.id === id()) };
    });
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
    this.olympics.set({ state: 'loading' });
    // HttpClient still returns an Observable: signals do not replace it in Angular 18
    this.http
      .get<Olympic[]>(environment.dataUrl)
      .pipe(
        map((olympics) => [...olympics].sort((a, b) => this.countMedals(b) - this.countMedals(a))),
      )
      .subscribe({
        next: (olympics) => this.olympics.set({ state: 'loaded', olympics }),
        error: () => this.olympics.set({ state: 'error' }),
      });
  }
}
