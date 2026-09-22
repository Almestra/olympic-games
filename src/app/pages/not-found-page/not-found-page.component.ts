import { Component } from '@angular/core';

import { HeaderComponent } from '../../components/header/header.component';
import { PageStatusComponent } from '../../components/page-status/page-status.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [HeaderComponent, PageStatusComponent],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.scss'
})
export class NotFoundPageComponent {
  readonly title = 'Page not found';
}
