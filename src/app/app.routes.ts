import { Routes } from '@angular/router';

import { CountryDetailPageComponent } from './pages/country-detail-page/country-detail-page.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundPageComponent } from './pages/not-found-page/not-found-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'country/:id', component: CountryDetailPageComponent },
  { path: 'not-found', component: NotFoundPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
