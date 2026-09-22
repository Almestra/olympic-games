import { Routes } from '@angular/router';

import { CountryDetailPageComponent } from './pages/country-detail-page/country-detail-page.component';
import { DashboardPageComponent } from './pages/dashboard-page/dashboard-page.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';

export const routes: Routes = [
  { path: '', component: DashboardPageComponent },
  { path: 'country/:id', component: CountryDetailPageComponent },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
