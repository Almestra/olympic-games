import { Component, Input } from '@angular/core';

import { PageState } from '../../models/page-state.model';

type Status = Exclude<PageState, 'loaded'>;

const MESSAGES: Record<Status, string> = {
  loading: 'Loading…',
  empty: 'No data available.',
  error: 'Unable to load the data. Please try again later.'
};

@Component({
  selector: 'app-page-status',
  standalone: true,
  imports: [],
  templateUrl: './page-status.component.html',
  styleUrl: './page-status.component.scss'
})
export class PageStatusComponent {
  @Input({ required: true }) state: Status = 'loading';

  get message(): string {
    return MESSAGES[this.state];
  }
}
